// auth.js

// Kullanıcının oturum açıp açmadığını kontrol eden fonksiyon
export const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    return !!token; // Token varsa true, yoksa false döner
};

// Kullanıcının oturumdan çıkmasını sağlayan fonksiyon
export const logout = () => {
    localStorage.removeItem("token");
};
