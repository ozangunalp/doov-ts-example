import "./formik-demo.css";
import * as React from "react";
import {render} from "react-dom";
import {FormikProps, withFormik} from "formik";

import Select from "react-select";
import {DisplayFormikState} from "./formik-helper";
import * as DOOV from 'doov';
import {converter, Function, map, mappings, when} from 'doov';
import {DOOVField, fieldItem, fieldOptions, fieldValue, Item, itemValues} from "./DOOVField";
import {FormContext, FormValues} from "./FormContext";
import {City, PizzaCrust, PizzaSize} from "./Pizza";

const crustOptions: Item[] = [
    {value: "neapolitan", label: "Neapolitan"},
    {value: "new_york", label: "New York"},
    {value: "st_louis", label: "St. Louis"},
    {value: "pan", label: "Pan"},
    {value: "deep_dish", label: "Deep Dish"},
    {value: "sicilian", label: "Sicilian"},
];

const toppingOptions: Item[] = [
    {value: "cream_sauce", label: "Cream Sauce"},
    {value: "tomato_sauce", label: "Tomato Sauce"},
    {value: "mozzarella", label: "Mozzarella"},
    {value: "mushrooms", label: "Mushrooms"},
    {value: "pepperoni", label: "Pepperoni"},
    {value: "olives", label: "Olives"},
    {value: "pineapple", label: "Pineapple"},
];

const cities: Item[] = [
    {value: "napoli", label: "Napoli"},
    {value: "paris", label: "Paris"},
    {value: "new_york", label: "New York"},
    {value: "chicago", label: "Chicago"},
    {value: "hawaii", label: "Hawaii"}
];

const pizzaSizeOptions: Item[] = [
    {value: 'S', label: "Small"},
    {value: 'M', label: "Medium"},
    {value: 'L', label: "Large"},
    {value: 'XL', label: "XLarge"},
];

// Fields
const toppings = DOOV.iterable(DOOV.field<object, string[]>('toppings'));
const city = DOOV.f(DOOV.field<object, City>('city'));
const size = DOOV.string(DOOV.field<object, PizzaSize>('size'));
const crust = DOOV.f(DOOV.field<object, PizzaCrust>('crust'));

// Validation Rules
const cityNotEmpty = when(city.isNullOrUndefined()).validate();
const emptyToppings = when(toppings.isEmpty()).validate();

const formikEnhancer = withFormik({
    validate: (values) => {
        let errors: any = {};
        if (cityNotEmpty.execute(values).value) {
            errors.city = 'Required';
        }
        if (emptyToppings.execute(values).value) {
            errors.toppings = 'Add at least one topping';
        }
        return errors;
    },
    handleSubmit: (values, {setSubmitting}) => {
        console.log(values);
        const payload = {...values};
        setTimeout(() => {
            alert(JSON.stringify(payload, null, 2));
            setSubmitting(false);
        }, 1000);
    },
    displayName: "MyForm"
});

const MyForm = (props: FormikProps<FormValues>) => {
    const {
        values,
        setValues,
        touched,
        dirty,
        errors,
        handleSubmit,
        handleReset,
        isSubmitting,
        setFieldTouched,
    } = props;

    const cityNotEmpty = when(city.isDefined()).validate();

    const itemsStringConverter = converter((obj, input: Function<Item[]>, context) => {
        let v = input.get(obj, context);
        return v ? v.map(value => value.value) : [];
    }, 'items to values');

    const valueToItem = (items: Item[]) => converter((obj, input, ctx) => {
        let value = input.get(obj, ctx);
        return items.find(v => v.value === value)
    }, 'value to Item');

    // City Rules
    const cityChangeRule = mappings(
        // update City
        map(fieldValue).to(city),
        // update Toppings
        when(city.matchAny('hawaii', 'napoli')).then(
            map(toppings).using(converter((obj, input, ctx) => {
                const items = input.get(obj, ctx);
                return items ? items.filter(v => v !== 'pineapple') : []
            }, 'filter pineapple')).to(toppings)));
    const cityValueRule = map(city).using(valueToItem(cities)).to(fieldItem);

    // Size Rules
    const sizeChangeRule = map(fieldValue).to(size);
    const sizeValueRule = map(size).using(valueToItem(pizzaSizeOptions)).to(fieldItem);

    // Toppings Rules
    const toppingsOptionsRule = when(city.matchAny('hawaii', 'napoli'))
        .then(map(toppingOptions.filter(v => v.value !== 'pineapple')).to(fieldOptions))
        .otherwise(map(toppingOptions).to(fieldOptions));
    const toppingsChangeRule = map(itemValues).using(itemsStringConverter).to(toppings);
    const toppingsValueRule = map(toppings).using(converter((obj, input, ctx) => {
        let value = input.get(obj, ctx);
        return value ? value.map(v => toppingOptions.find(item => item.value === v)) : [];
    })).to(itemValues);

    // Crust Rules
    const crustOptionsRule = map(crustOptions).to(fieldOptions);
    const crustChangeRule = map(fieldValue).to(crust);
    const crustValueRule = map(crust).using(valueToItem(crustOptions)).to(fieldItem);

    return (
        <form onSubmit={handleSubmit}>
            <FormContext.Provider
                value={{formValues: values, setFormValues: setValues, setFieldTouched: setFieldTouched}}>
                <DOOVField
                    name="city"
                    label="Where do you live?"
                    component={Select}
                    error={errors.city}
                    touched={touched.city}
                    options={cities}
                    changeRule={cityChangeRule}
                    valueRule={cityValueRule}
                />
                <DOOVField
                    name="size"
                    label="How hungry you are?"
                    component={Select}
                    error={errors.size}
                    touched={touched.size}
                    options={pizzaSizeOptions}
                    visibilityRule={cityNotEmpty}
                    valueRule={sizeValueRule}
                    changeRule={sizeChangeRule}
                />
                <DOOVField
                    name="toppings"
                    label="Which toppings you'd like?"
                    isMulti
                    component={Select}
                    error={errors.toppings}
                    touched={touched.toppings}
                    optionsRule={toppingsOptionsRule}
                    visibilityRule={cityNotEmpty}
                    valueRule={toppingsValueRule}
                    changeRule={toppingsChangeRule}
                />
                <DOOVField
                    name="crust"
                    label="Which pizza crust you'd like?"
                    component={Select}
                    error={errors.crust}
                    touched={touched.crust}
                    optionsRule={crustOptionsRule}
                    visibilityRule={cityNotEmpty}
                    valueRule={crustValueRule}
                    changeRule={crustChangeRule}
                />
                <button
                    type="button"
                    className="outline"
                    onClick={handleReset}
                    disabled={!dirty || isSubmitting}>
                    Reset
                </button>
                <button type="submit" disabled={isSubmitting}>
                    Get Pizza!
                </button>

                <DisplayFormikState {...props} />
            </FormContext.Provider>
        </form>
    );
};

const MyEnhancedForm = formikEnhancer(MyForm);

const App = () => (
    <div className="app">
        <MyEnhancedForm/>
    </div>
);

render(<App/>, document.getElementById("root"));
