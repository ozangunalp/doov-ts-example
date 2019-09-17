import * as React from "react";
import {City, PizzaCrust, PizzaSize} from "./Pizza";

export interface FormValues {
    toppings: string[];
    city?: City;
    size?: PizzaSize;
    crust?: PizzaCrust;
}

type FormValuesContext = {
    formValues: FormValues,
    setFormValues: (v: FormValues) => void
    setFieldTouched: (field: string, isTouched?: boolean) => void
}

export const FormContext = React.createContext<FormValuesContext>({
    formValues: {} as FormValues,
    setFormValues: v => {
    },
    setFieldTouched: (f, t) => {
    },
});