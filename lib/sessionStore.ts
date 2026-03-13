export const setSessionData = (key: string, data: any) => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(key, JSON.stringify(data));
  }
};

export const getSessionData = (key: string) => {
  if (typeof window !== "undefined") {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  return null;
};

export const clearSessionData = () => {
   if (typeof window !== "undefined") {
     sessionStorage.clear();
   }
}
