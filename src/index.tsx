import "./formik-demo.css";
import * as React from "react";
import {render} from "react-dom";
import {Field, FormikProps, withFormik} from "formik";

import Select from "react-select";
import {DisplayFormikState} from "./formik-helper";
import * as DOOV from 'doov';
import {converter, DefaultContext, Function, FunctionMetadata, StringFunction} from 'doov';

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

const optionsValue = new Function<Item[]>(new FunctionMetadata('options value'), (obj: object, ctx?: any) => {
    return ctx!.props['options'];
}, (obj: object, value: Item[], ctx?) => {
    return (ctx!.props['options'] as unknown as Item[]) = value;
});

const itemValues = Function.contextual(new FunctionMetadata('item field values'), (obj, ctx) => {
    return ctx!.props['value'] as unknown as Item[];
});

const singleItemValue = Function.contextual(new FunctionMetadata('item field value'), (obj, ctx) => {
    return ctx!.props['value'] as unknown as Item;
});

const cityNotEmpty = DOOV.when(city.notEq(emptyOption)).validate();

const emptyToppings = DOOV.when(toppings.isNotEmpty()).validate();

// const emailNotNull = DOOV.when(email.isNullOrUndefined().not()).validate();

// const emailValid = DOOV.when(email
//     .mapTo(DOOV.BooleanFunction, (v: string) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(v))).validate();

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

const MyForm: React.SFC<FormikProps<FormValues>> = props => {
    const {
        values,
        setValues,
        touched,
        dirty,
        errors,
        handleBlur,
        handleSubmit,
        handleReset,
        setFieldValue,
        isSubmitting,
    } = props;

    const cityNotEmpty = DOOV.when(city.notEq(emptyOption)).validate();

    const toppingsChangeRule = DOOV.mappings(DOOV.map(itemValues).to(toppings));

    const cityChangeRule = DOOV.mappings(
        DOOV.map(singleItemValue).to(city),
        DOOV.when(city.mapTo(StringFunction, v => v ? v.value : undefined).eq('hawaii'))
            .then(DOOV.map(toppings.mapTo(Function, items => {
                return items!.filter(v => v.value !== 'pineapple')
            })).to(toppings)));

    const sizeChangeRule = DOOV.mappings(
        DOOV.map(singleItemValue).using(converter((obj, input, context) => {
            let v = input.get(obj, context);
            return v ? v.value : v;
        })).to(size),
    );

    const toppingsOptionsRule = DOOV.when(city.mapTo(StringFunction, v => v ? v.value : undefined).notEq('hawaii'))
        .then(DOOV.map(toppingOptions).to(optionsValue))
        .otherwise(DOOV.map(toppingOptions.filter(v => v.value !== 'pineapple')).to(optionsValue));

    const crustOptionsRule = DOOV.map(Object.keys(PizzaCrust).map(v => ({
        value: v,
        label: v
    }) as Item)).to(optionsValue);

    return (
        <form onSubmit={handleSubmit}>
            <StatefulField
                name="city"
                label="Where do you live?"
                component={Select}
                formValues={values}
                setFormValues={setValues}
                options={cities}
                changeRule={cityChangeRule}
                value={values.city}
                onBlur={handleBlur}
                error={errors.city}
                touched={touched.city}
            />
            <StatefulField
                label="Size"
                name="How hungry you are?"
                component={Select}
                formValues={values}
                setFormValues={setValues}
                visibilityRule={cityNotEmpty}
                options={pizzaSizeOptions}
                value={pizzaSizeOptions.find(v => v.value === values.size)}
                changeRule={sizeChangeRule}
                onBlur={handleBlur}
                error={errors.size}
                touched={touched.size}
            />
            <StatefulField
                name="toppings"
                label="Which toppings you'd like?"
                isMulti
                component={Select}
                formValues={values}
                setFormValues={setValues}
                visibilityRule={cityNotEmpty}
                optionsRule={toppingsOptionsRule}
                value={values.toppings}
                changeRule={toppingsChangeRule}
                onBlur={handleBlur}
                error={errors.toppings}
                touched={touched.toppings}
            />
            <StatefulField
                name="crust"
                label="Which pizza crust you'd like?"
                component={Select}
                setFormValues={setValues}
                formValues={values}
                visibilityRule={cityNotEmpty}
                optionsRule={crustOptionsRule}
                // options={toppingOptions}
                value={Object.keys(PizzaCrust).find(v => v === values.crust)}
                onChange={(value: Item) => setFieldValue('crust', value)}
                onBlur={handleBlur}
                error={errors.crust}
                touched={touched.crust}
            />
            <button
                type="button"
                className="outline"
                onClick={handleReset}
                disabled={!dirty || isSubmitting}
            >
                Reset
            </button>
            <button type="submit" disabled={isSubmitting}>
                Get Pizza!
            </button>

            <DisplayFormikState {...props} />
        </form>
    );
};

class StatefulField extends React.Component<any> {
    static defaultProps = {
        isDisabled: false,
        isVisible: true,
        options: undefined,
    };

    constructor(props: any) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleOptions = this.handleOptions.bind(this);
        this.handleVisibility = this.handleVisibility.bind(this);
    }

    handleOptions() {
        if (this.props.optionsRule) {
            const ctx = new DefaultContext();
            this.props.optionsRule.execute(this.props.formValues, ctx);
            return ctx.props['options'];
        } else {
            return this.props.options;
        }
    }

    handleVisibility() {
        if (this.props.visibilityRule) {
            const ctx = new DefaultContext();
            return this.props.visibilityRule.execute(this.props.formValues, ctx).value;
        } else {
            return this.props.isVisible;
        }
    }

    handleChange(value: any) {
        if (this.props.changeRule) {
            const ctx = new DefaultContext();
            ctx.props['value'] = value;
            this.props.setFormValues(this.props.changeRule.execute(this.props.formValues, ctx));
        } else {
            this.props.onChange(value);
        }
    };

    render() {
        return (
            this.handleVisibility() &&
            (<React.Fragment>
                <label htmlFor="function" style={{display: "block", margin: ".5rem"}}>
                    {this.props.label ? this.props.label : this.props.name}
                </label>
                <Field
                    {...this.props}
                    options={this.handleOptions()}
                    onChange={this.handleChange}
                />
                {!!this.props.error && this.props.touched && (
                    <div style={{color: "red", marginTop: ".5rem"}}>
                        {this.props.error}
                    </div>
                )}
            </React.Fragment>)
        );
    }
}

const MyEnhancedForm = formikEnhancer(MyForm);

const App = () => (
    <div className="app">
        <MyEnhancedForm/>
    </div>
);

render(<App/>, document.getElementById("root"));
