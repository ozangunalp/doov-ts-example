import "./formik-demo.css";
import * as React from "react";
import {useContext} from "react";
import {render} from "react-dom";
import {Field, FormikProps, withFormik} from "formik";

import Select from "react-select";
import {DisplayFormikState} from "./formik-helper";
import * as DOOV from 'doov';
import {converter, DefaultContext, Function, FunctionMetadata, map, mappings, when} from 'doov';

export type PizzaSize = 'S' | 'M' | 'L' | 'XL';

export enum PizzaCrust {
    Neapolitan = 'Neapolitan',
    NewYork = 'New York',
    StLouis = 'St. Louis',
    Pan = 'Pan',
    DeepDish = 'Deep Dish',
    Sicilian = 'Sicilian',
}

const crustOptions: Item[] = Object.keys(PizzaCrust).map(v => ({value: v, label: PizzaCrust[v]}));
console.log(crustOptions);

export type City = 'napoli' | 'paris' | 'chicago' | 'new_york' | 'hawaii';

export interface PizzaSpec {
    size?: PizzaSize;
    crust?: PizzaCrust;
    toppings?: string[];
}

export interface PizzaOrder {
    city?: City;
    pizza?: PizzaSpec;
    payment?: 'Credit Card' | 'Cash' | 'Online';
}

interface FormValues {
    toppings: string[];
    city?: City;
    size?: PizzaSize;
    crust?: PizzaCrust;
}

type Item = {
    value: string;
    label: string;
};

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

const toppings = DOOV.iterable(DOOV.field<object, string[]>('toppings'));
const city = DOOV.f(DOOV.field<object, City>('city'));
const size = DOOV.string(DOOV.field<object, PizzaSize>('size'));
const crust = DOOV.string(DOOV.field<object, PizzaCrust>('crust'));

const fieldOptions = new Function<Item[]>(new FunctionMetadata('field options'), (obj: object, ctx?: any) => {
    return ctx!.props['options'];
}, (obj: object, value: Item[], ctx?) => {
    return (ctx!.props['options'] as unknown as Item[]) = value;
});

const itemValues = new Function<Item[]>(new FunctionMetadata('field values'), (obj, ctx) => {
    return ctx!.props['value'] as unknown as Item[];
}, (obj, value: Item[], ctx) => {
    return (ctx!.props['value'] as unknown as Item[]) = value
});

const fieldValue = new Function<string>(new FunctionMetadata('field value'), (obj, ctx) => {
    return (ctx!.props['value'] as unknown as Item).value;
});

const fieldItem = Function.consumer(new FunctionMetadata('field item'),
    (obj: object, value: Item, ctx?) => {
    return (ctx!.props['value'] as unknown as Item) = value;
});

const cityNotEmpty = when(city.isDefined()).validate();

const emptyToppings = when(toppings.isNotEmpty()).validate();

const formikEnhancer = withFormik({
    validate: (values) => {
        let errors: any = {};
        if (!cityNotEmpty.execute(values).value) {
            errors.city = 'Required';
        }
        if (!emptyToppings.execute(values).value) {
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

type FormValuesContext = {
    formValues: FormValues,
    setFormValues: (v: FormValues) => void
    setFieldTouched: (field: string, isTouched?: boolean) => void
}

let FormContext = React.createContext<FormValuesContext>({
    formValues: {} as FormValues,
    setFormValues: v => {
    },
    setFieldTouched: (f, t) => {
    },
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

const DOOVField = (props: any) => {

    const {formValues, setFormValues, setFieldTouched} = useContext(FormContext);

    const handleVisibility = () => {
        if (props.visibilityRule) {
            const ctx = new DefaultContext();
            return props.visibilityRule.execute(formValues, ctx).value;
        } else {
            return props.isVisible;
        }
    };

    const handleOptions = () => {
        if (props.optionsRule) {
            const ctx = new DefaultContext();
            props.optionsRule.execute(formValues, ctx);
            return ctx.props['options'];
        } else {
            return props.options;
        }
    };

    const handleChange = (value: any) => {
        if (props.changeRule) {
            const ctx = new DefaultContext();
            ctx.props['value'] = value;
            setFormValues(props.changeRule.execute(formValues, ctx));
        } else {
            props.onChange(value);
        }
    };

    const handleBlur = () => {
        setFieldTouched(props.name);
    };

    const handleValue = () => {
        if (props.valueRule) {
            const ctx = new DefaultContext();
            props.valueRule.execute(formValues, ctx);
            return ctx.props['value'];
        } else {
            return props.value;
        }
    };

    return (
        handleVisibility() &&
        (<React.Fragment>
            <label htmlFor="function" style={{display: "block", margin: ".5rem"}}>
                {props.label ? props.label : props.name}
            </label>
            <div>
                {window.location.search === '?debug' && props.changeRule &&
                (<p><strong>Change rule: </strong><br/><code>{props.changeRule.metadata.readable}</code></p>)
                }
                {window.location.search === '?debug' && props.visibilityRule &&
                (<p><strong>Visibility rule: </strong><br/><code>{props.visibilityRule.metadata.readable}</code></p>)
                }
                {window.location.search === '?debug' && props.optionsRule &&
                (<p><strong>Options rule: </strong><br/><code>{props.optionsRule.metadata.readable}</code></p>)
                }
                {window.location.search === '?debug' && props.valueRule &&
                (<p><strong>Value rule: </strong><br/><code>{props.valueRule.metadata.readable}</code></p>)
                }
            </div>
            <Field
                {...props}
                name={props.name}
                options={handleOptions()}
                onChange={handleChange}
                onBlur={handleBlur}
                value={handleValue()}
            />
            {!!props.error && props.touched && (
                <div style={{color: "red", marginTop: ".5rem"}}>
                    {props.error}
                </div>
            )}
        </React.Fragment>)
    );
};

DOOVField.defaultProps = {
    isDisabled: false,
    isVisible: true,
    options: undefined,
};

const MyEnhancedForm = formikEnhancer(MyForm);

const App = () => (
    <div className="app">
        <MyEnhancedForm/>
    </div>
);

render(<App/>, document.getElementById("root"));
