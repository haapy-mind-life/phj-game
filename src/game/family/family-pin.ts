/** The visible PIN is short; Supabase still receives a password of the required length.
 * Six-digit logins are accepted for existing installations during the transition.
 */
export function familyAuthPassword(pin: string): string {
  if (/^[0-9]{4}$/.test(pin)) return `family-pin:${pin}`;
  if (/^[0-9]{6}$/.test(pin)) return pin;
  throw new Error("숫자 암호 4자리를 입력해 주세요.");
}
