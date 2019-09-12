import "./formik-demo.css";
import * as React from "react";
import {useContext} from "react";
import {render} from "react-dom";
import {Field, FormikProps, withFormik} from "formik";

import Select from "react-select";
import {DisplayFormikState} from "./formik-helper";
import * as DOOV from 'doov';
import {converter, DefaultContext, Function, FunctionMetadata, map, mappings, StringFunction, when} from 'doov';

export type PizzaSize = 'S' | 'M' | 'L' | 'XL';

export enum PizzaCrust {
    Neapolitan = 'Neapolitan',
    NewYork = 'NewYork',
    StLouis = 'StLouis',
    Pan = 'Pan',
    DeepDish = 'DeepDish',
    Sicilian = 'Sicilian',
}

export type City = 'Napoli' | 'Paris' | 'Chicago' | 'New York' | 'Hawaii';

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
    city: City;
    size: PizzaSize;
    crust: PizzaCrust;
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
    {value: "new york", label: "New York"},
    {value: "chicago", label: "Chicago"},
    {value: "hawaii", label: "Hawaii"}
];

const pizzaSizeOptions: Item[] = [
    {value: 'S', label: "Small"},
    {value: 'M', label: "Medium"},
    {value: 'L', label: "Large"},
    {value: 'XL', label: "XLarge"},
];

const emptyOption: Item = {value: "", label: ""};

const toppings = DOOV.iterable(DOOV.field<object, Item[]>('toppings'));
const city = DOOV.f(DOOV.field<object, Item>('city'));
const size = DOOV.string(DOOV.field<object, string>('size'));
const crust = DOOV.string(DOOV.field<object, string>('crust'));

const optionsValue = new Function<Item[]>(new FunctionMetadata('field options'), (obj: object, ctx?: any) => {
    return ctx!.props['options'];
}, (obj: object, value: Item[], ctx?) => {
    return (ctx!.props['options'] as unknown as Item[]) = value;
});

const itemValues = Function.contextual(new FunctionMetadata('field items'), (obj, ctx) => {
    return ctx!.props['value'] as unknown as Item[];
});

const singleItemValue = Function.contextual(new FunctionMetadata('field item'), (obj, ctx) => {
    return ctx!.props['value'] as unknown as Item;
});

const cityNotEmpty = when(city.notEq(emptyOption)).validate();

const emptyToppings = when(toppings.isNotEmpty()).validate();

const formikEnhancer = withFormik({
    mapPropsToValues: props => ({
        toppings: [],
        size: '',
        crust: emptyOption,
        city: emptyOption,
    }),
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
        const payload = {
            ...values,
            city: values.city.value,
            topics: values.toppings.map((t: Item) => t.value)
        };
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

    const cityNotEmpty = when(city.notEq(emptyOption)).validate();

    const itemValueConverter = converter((obj, input: Function<Item>, context) => {
        let v = input.get(obj, context);
        return v ? v.value : v;
    }, 'item to value');

    // City Rules
    const cityChangeRule = mappings(
        // update City
        map(singleItemValue).to(city),
        // update Toppings
        when(city.mapTo(StringFunction, v => v ? v.value : undefined).matchAny('hawaii', 'napoli'))
            .then(map(toppings.mapTo(Function, items => {
                return items!.filter(v => v.value !== 'pineapple')
            })).to(toppings)));

    // Size
    const sizeChangeRule = map(singleItemValue).using(itemValueConverter).to(size);

    // Toppings Rules
    const toppingsOptionsRule = when(city.mapTo(StringFunction, v => v ? v.value : undefined).matchAny('hawaii', 'napoli'))
        .then(map(toppingOptions.filter(v => v.value !== 'pineapple')).to(optionsValue))
        .otherwise(map(toppingOptions).to(optionsValue));

    const toppingsChangeRule = mappings(map(itemValues).to(toppings));

    // Crust Rules
    const crustOptionsRule = map(Object.keys(PizzaCrust))
        .using(converter((obj, input: Function<string[]>, ctx) => {
            return input.get(obj, ctx)!.map(v => ({
                value: v.toLowerCase(),
                label: v
            }) as Item)
        }))
        .to(optionsValue);

    const crustChangeRule = map(singleItemValue).using(itemValueConverter).to(crust);

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
                    value={values.city}
                />
                <DOOVField
                    name="size"
                    label="How hungry you are?"
                    component={Select}
                    error={errors.size}
                    touched={touched.size}
                    options={pizzaSizeOptions}
                    visibilityRule={cityNotEmpty}
                    value={pizzaSizeOptions.find(v => v.value === values.size)}
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
                    value={values.toppings}
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
                    value={Object.keys(PizzaCrust).find(v => v === values.crust)}
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
            </div>
            <Field
                {...props}
                name={props.name}
                options={handleOptions()}
                onChange={handleChange}
                onBlur={handleBlur}
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
