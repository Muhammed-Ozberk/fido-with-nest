// auth.js

// Kullanıcının oturum açıp açmadığını kontrol eden fonksiyon
export const isAuthenticated = () => {
    const token = localStorage.getItem("access_token");
    return !!token; // Token varsa true, yoksa false döner
};

// Kullanıcının oturumdan çıkmasını sağlayan fonksiyon
export const logout = () => {
    localStorage.removeItem("access_token");
};
