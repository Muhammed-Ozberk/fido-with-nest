import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom"; // React Router'dan useNavigate'ı import ediyoruz
import "./register.css";

const Register = () => {
    const navigate = useNavigate(); // useNavigate kancasını kullanarak navigate fonksiyonunu alıyoruz

    const formik = useFormik({
        initialValues: {
            name: "",
            username: "",
            password: "",
        },
        validationSchema: Yup.object({
            name: Yup.string()
                .min(2, "İsim en az 2 karakter olmalıdır")
                .required("İsim gereklidir"),
            username: Yup.string()
                .min(3, "Kullanıcı adı en az 3 karakter olmalıdır")
                .required("Kullanıcı adı gereklidir"),
            password: Yup.string()
                .min(5, "Şifre en az 5 karakter olmalıdır")
                .required("Şifre gereklidir"),
        }),
        onSubmit: async (values) => {
            try {
                const response = await fetch("http://localhost:8080/auth/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    throw new Error("Bir hata oluştu, lütfen tekrar deneyin");
                }

                // Kayıt başarılıysa login ekranına yönlendirin
                navigate("/login"); // Burada kullanıcıyı /login yoluna yönlendiriyoruz

            } catch (error) {
                alert("Kayıt başarısız: " + error.message);
            }
        },
    });

    return (
        
        // Register Container
        <div className="register-container">
            <div className="register-form">
                <h2>Kayıt Ol</h2>
                <form onSubmit={formik.handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">İsim</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.name}
                        />
                        {formik.touched.name && formik.errors.name ? (
                            <div className="error">{formik.errors.name}</div>
                        ) : null}
                    </div>

                    <div className="form-group">
                        <label htmlFor="username">Kullanıcı Adı</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.username}
                        />
                        {formik.touched.username && formik.errors.username ? (
                            <div className="error">{formik.errors.username}</div>
                        ) : null}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Şifre</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.password}
                        />
                        {formik.touched.password && formik.errors.password ? (
                            <div className="error">{formik.errors.password}</div>
                        ) : null}
                    </div>

                    <button type="submit">Kayıt Ol</button>
                </form>
            </div>
        </div>
    );
};

export default Register;
