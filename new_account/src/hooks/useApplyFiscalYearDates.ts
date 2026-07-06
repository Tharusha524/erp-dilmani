import { useEffect } from "react";
import {
  applyFiscalYearDateFields,
  useFiscalYearFormDefaults,
} from "./useFiscalYearFormDefaults";

type DateFieldMap<T> = {
  startDate?: keyof T;
  endDate?: keyof T;
  asAtDate?: keyof T;
  activitySince?: keyof T;
};

/** Prefill empty date fields on report/inquiry forms from the active fiscal year. */
export function useApplyFiscalYearDates<T extends object>(
  setFormData: React.Dispatch<React.SetStateAction<T>>,
  fields: DateFieldMap<T>
) {
  const defaults = useFiscalYearFormDefaults();

  useEffect(() => {
    if (defaults.isLoading) {
      return;
    }

    setFormData((prev) => applyFiscalYearDateFields(prev, defaults, fields));
    // fields map is static per form file
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaults.isLoading, defaults.startDate, defaults.endDate, defaults.asAtDate, setFormData]);

  return defaults;
}
