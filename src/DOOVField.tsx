import {default as React, useContext} from "react";
import {DefaultContext, Function, FunctionMetadata} from "doov";
import {Field} from "formik";
import {FormContext} from "./FormContext";

export type Item = {
    value: string;
    label: string;
};

export const fieldOptions = new Function<Item[]>(new FunctionMetadata('field options'), (obj: object, ctx?: any) => {
    return ctx!.props['options'];
}, (obj: object, value: Item[], ctx?) => {
    return (ctx!.props['options'] as unknown as Item[]) = value;
});

export const itemValues = new Function<Item[]>(new FunctionMetadata('field values'), (obj, ctx) => {
    return ctx!.props['value'] as unknown as Item[];
}, (obj, value: Item[], ctx) => {
    return (ctx!.props['value'] as unknown as Item[]) = value
});

export const fieldValue = new Function<string>(new FunctionMetadata('field value'), (obj, ctx) => {
    return (ctx!.props['value'] as unknown as Item).value;
});

export const fieldItem = Function.consumer(new FunctionMetadata('field item'),
    (obj: object, value: Item, ctx?) => {
        return (ctx!.props['value'] as unknown as Item) = value;
    });

export const DOOVField = (props: any) => {

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