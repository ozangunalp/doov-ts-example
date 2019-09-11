import "./formik-demo.css";
import * as React from "react";
import {render} from "react-dom";
import {
  FastField,
  Field,
  withFormik,
  FormikProps
} from "formik";

import Select from "react-select";
import {DisplayFormikState} from "./formik-helper";
import * as DOOV from 'doov';

interface FormValues {
    email: string;
    topics: string[];
    company: Item;
    function: string;
}

type Item = {
    value: string;
    label: string;
};

const options: Item[] = [
    {value: "Food", label: "Food"},
    {value: "Being Fabulous", label: "Being Fabulous"},
    {value: "Ken Wheeler", label: "Ken Wheeler"},
    {value: "ReasonML", label: "ReasonML"},
    {value: "Unicorns", label: "Unicorns"},
    {value: "Kittens", label: "Kittens"}
  ];
  
  const companies: Item[]  = [
    {value: "facebook", label: "Facebook"},
    {value: "github", label: "GitHub"}
  ];
  
  const emptyOption = {value: "", label: ""};
  

const email = DOOV.string(DOOV.field('email'));
const topics = DOOV.iterable(DOOV.field<object, string[]>('topics'));
const company = DOOV.f(DOOV.field<object, Item>('company'));

const emailValid = DOOV.when(email
    .mapTo(DOOV.BooleanFunction, (v: string) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(v))
    .and(email.isNotNull())).validate();

const formikEnhancer = withFormik({
  mapPropsToValues: props => ({
    email: "",
    topics: [],
    company: emptyOption
  }),
  validate: values => {
    let errors = {} as any;
    const result = emailValid.execute(values);
    if (!result.value) {
        errors.email = 'Invalid email address';
    }
    return errors;
  },
  handleSubmit: (values, {setSubmitting}) => {
    const payload = {
      ...values,
      company: values.company.value,
      topics: values.topics.map((t:Item) => t.value)
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
      handleChange,
      handleBlur,
      handleSubmit,
      handleReset,
      setFieldValue,
      setFieldTouched,
      isSubmitting
    } = props;

    const notEmpty = DOOV.when(company.notEq(emptyOption)).validate();

    return (
        <form onSubmit={handleSubmit}>
          <label htmlFor="email" style={{display: "block"}}>
            Email
          </label>
          <FastField
              name="email"
              component="input"
              placeholder="Enter your email"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
          />
          {errors.email && touched.email && (
              <div style={{color: "red", marginTop: ".5rem"}}>{errors.email}</div>
          )}
          <label htmlFor="company" style={{display: "block"}}>
            Company
          </label>
          <Field
              name="company"
              component={Select}
              options={companies.filter(v => v.value.startsWith('git'))}
              value={values.company}
              onChange={(value: string) => setFieldValue("company", value)}
              onBlur={() => setFieldTouched("company")}
              error={errors.company}
              touched={touched.company}
          />
          <label htmlFor="function" style={{display: "block"}}>
            Function
          </label>
          <Field
              name="function"
              component="input"
              disabled={true}
              value={values.company.value === 'github' ? 'Developer' : 'Manager'}
              onChange={(value: string) => setFieldValue("function", value)}
              onBlur={() => setFieldTouched("function")}
              error={errors.function}
              touched={touched.function}
          />
          {errors.company && touched.company && (
              <div style={{color: "red", marginTop: ".5rem"}}>{Object.values(errors.company)}</div>
          )}
          <label htmlFor="topics">
            Topics (select at least 3)
          </label>
          <StatefulField
              name="topics"
              component={Select}
              isVisible={notEmpty.execute(values).value}
              isDisabled={!values.company.value}
              options={
                values.company.value ? options : []
              }
              isMulti
              value={values.topics}
              onChange={(field: string, value: string[]) => {
                  console.log(props);
                  setValues(
                      DOOV.mappings(
                          DOOV.map(value).to(topics),
                          DOOV.when(email.length().notEq(0)).then(
                              DOOV.map(email.concat('.tr')).to(email)
                              ),
                          DOOV.map(emptyOption).to(company),
                          ).execute(values));
              }}
              onBlur={(field: string, blur: boolean) => {
                setFieldTouched(field)
              }}
              error={errors.topics}
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
            Submit
          </button>

          <DisplayFormikState {...props} />
        </form>
    );
}

class StatefulField extends React.Component<any> {
  static defaultProps = {
    isDisabled: false
  };

  handleChange = (value: string) => {
    // this is going to call setFieldValue and manually update values[this.props.name]
    this.props.onChange(this.props.name, value);
  };

  handleBlur = () => {
    // this is going to call setFieldTouched and manually update touched[this.props.name]
    this.props.onBlur(this.props.name, true);
  };

  render() {
    return (
        this.props.isVisible &&
        (<React.Fragment>
          <Field
              {...this.props}
              onChange={this.handleChange}
              onBlur={this.handleBlur}
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
