export function calculateAge(dob: Date) {
  if (!dob) {
    return "";
  }
  const ageDifMs = Date.now() - dob.getTime();
  const ageDate = new Date(ageDifMs);
  return `(${Math.abs(ageDate.getUTCFullYear() - 1970)} yrs)`;
}
