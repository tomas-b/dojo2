import { useEffect } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface FormuValidationHelpers {
  isEmail: (value: string) => boolean;
  get: (ref: string) => string;
}

interface FormuInput {
  ref?: string;
  label: string;
  type: string;
  value?: string;
  validation?: (value: string, helpers: FormuValidationHelpers) => any;
  component?: (props: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => JSX.Element;
}

interface FormuStore {
  _inputs: (FormuInput & {
    _value?: string;
    _onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  })[];
  load: (inputs: FormuInput[]) => void;
  check: () => boolean;
  errors: string[];
  submit: boolean;
}

const useStore = create(
  immer<FormuStore>((set, get) => ({
    _inputs: [],
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
      const errors: string[] = [];
      const helpers: FormuValidationHelpers = {
        isEmail: (value) => {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        get: (ref) => {
          const input = get()._inputs.find((input) => input.ref === ref);
          if (!input) {
            throw new Error(`No input found with ref: ${ref}`);
          }
          return input._value!;
        },
      };
      _inputs.forEach((input) => {
        if (input.validation) {
          const valid = input.validation(input._value!, helpers);
          if (!valid) {
            errors.push(input.label);
          }
        }
      });
      set((state) => {
        state.errors = errors;
        state.submit = errors.length === 0 && _inputs.length > 0;
      });
      return errors.length === 0 && _inputs.length > 0;
    },
    errors: [],
    submit: false,
  }))
);

const Formu = ({ inputs }: { inputs: FormuInput[] }) => {
  const { load, check, _inputs, errors, submit } = useStore();

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
              input.component({
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
        {errors.map((error, i) => (
          <li key={i}>{error}</li>
        ))}
      </ul>
      {submit && <span>sending!</span>}
    </>
  );
};

export { Formu };
