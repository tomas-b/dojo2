import { useEffect } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface FormuValidationHelpers {
  get: (ref: string) => string;
  args: string[];
}

interface FormuInput {
  ref?: string;
  label: string;
  type: string;
  value?: string;
  validations?: string[];
  component?: string;
}

interface FormuStore {
  _inputs: (FormuInput & {
    _value?: string;
    _onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  })[];
  load: (inputs: FormuInput[]) => void;
  helpers?: FormuValidationHelpers;
  validators: Record<
    string,
    (value: string, helpers: FormuValidationHelpers) => boolean
  >;
  components: Record<
    string,
    (props: {
      value: string;
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    }) => JSX.Element
  >;
  check: () => boolean;
  errors: Record<string, string[]>;
  submit: boolean;
}

const useStore = create(
  immer<FormuStore>((set, get) => ({
    _inputs: [],
    validators: {},
    components: {},
    helpers: {
      get: (ref) => {
        const input = get()._inputs.find((input) => input.ref === ref);
        if (!input) {
          throw new Error(`No input found with ref: ${ref}`);
        }
        return input._value!;
      },
      args: [],
    },
    load: (inputs) => {
      set((state) => {
        state.submit = false;
        state._inputs = inputs.map((input, i) => ({
          ...input,
          _value: input.value || "",
          _onChange: (e) => {
            set((s) => {
              s._inputs[i]._value = e.target.value;
            });
          },
        }));
      });
    },
    check: () => {
      const { _inputs } = get();
      const errors: Record<string, string[]> = {};
      _inputs.forEach((input) => {
        if (input.validations) {
          input.validations.forEach((validation) => {
            const [name, ...args] = validation.split(":");
            if (
              !get().validators[name](input._value!, {
                ...get().helpers!,
                args,
              })
            ) {
              if (!errors[input.label]) errors[input.label] = [];
              errors[input.label].push(name);
            }
          });
        }
      });
      set((state) => {
        state.errors = errors;
        state.submit =
          Object.entries(errors).length === 0 && _inputs.length > 0;
      });
      return Object.entries(errors).length === 0 && _inputs.length > 0;
    },
    errors: {},
    submit: false,
  }))
);

const addValidators = (
  validators: Record<
    string,
    (value: string, helpers: FormuValidationHelpers) => boolean
  >
) => {
  useStore.setState((state) => {
    state.validators = { ...state.validators, ...validators };
  });
};

const addComponents = (
  components: Record<
    string,
    (props: {
      value: string;
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    }) => JSX.Element
  >
) => {
  useStore.setState((state) => {
    state.components = { ...state.components, ...components };
  });
};

const Formu = ({ inputs }: { inputs: FormuInput[] }) => {
  const { load, check, _inputs, errors, submit, components } = useStore();

  useEffect(() => {
    load(inputs);
  }, [inputs]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (check()) {
      console.log("submit");
    } else {
      console.log("error");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {_inputs.map((input, i) => (
          <div key={i}>
            <label>{input.label}</label>
            {input.component ? (
              components[input.component]({
                value: input._value!,
                onChange: input._onChange!,
              })
            ) : (
              <input
                type={input.type}
                value={input.type === "submit" ? input.label : input._value}
                onChange={input._onChange}
              />
            )}
          </div>
        ))}
      </form>
      <ul>
        {Object.entries(errors).map(([label, errors]) => (
          <li>
            {label}:
            {errors.map((error, i) => (
              <span key={i}>{error}</span>
            ))}
          </li>
        ))}
      </ul>
      {submit && <span>sending!</span>}
    </>
  );
};

export { Formu, addValidators, addComponents };
