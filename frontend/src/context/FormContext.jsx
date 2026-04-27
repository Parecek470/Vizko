import { createContext, useState, useEffect, useContext, useCallback } from 'react';

const FormContext = createContext();

export function FormProvider({ children }) {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Wrap the fetch function in useCallback
    const fetchForms = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/forms/');
            if (response.ok) {
                const data = await response.json();
                setForms(data);
            }
        } catch (error) {
            console.error("Failed to fetch forms:", error);
        } finally {
            setLoading(false);
        }
    }, []); // Empty array means this function reference never changes

    // 2. Safely call it in useEffect
    useEffect(() => {
        fetchForms();
    }, [fetchForms]); // It's now safe to include here

    return (
        <FormContext.Provider value={{ forms, loading, refreshForms: fetchForms }}>
            {children}
        </FormContext.Provider>
    );
}

export const useForms = () => useContext(FormContext);