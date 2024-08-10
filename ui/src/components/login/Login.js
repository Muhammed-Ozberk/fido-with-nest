import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import "./login.css";
import { useNavigate } from "react-router-dom";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";

const Login = () => {
    const navigate = useNavigate();
    const [fidoEnabled, setFidoEnabled] = useState(false);
    const [fidoError, setFidoError] = useState("");

    const formik = useFormik({
        initialValues: {
            username: "",
            password: "",
        },
        validationSchema: Yup.object({
            username: Yup.string()
                .min(3, "Kullanıcı adı en az 3 karakter olmalıdır")
                .required("Kullanıcı adı gereklidir"),
            password: Yup.string()
                .min(5, "Şifre en az 5 karakter olmalıdır")
                .required("Şifre gereklidir"),
        }),
        onSubmit: async (values) => {
            try {
                const response = await fetch("http://localhost:8080/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    throw new Error("Giriş başarısız, lütfen tekrar deneyin");
                }

                const data = await response.json();
                localStorage.setItem("access_token", data.access_token);
                navigate("/");
            } catch (error) {
                alert("Giriş başarısız: " + error.message);
            }
        },
    });

    const handleFidoLogin = async () => {
        setFidoError("");

        if (!browserSupportsWebAuthn()) {
            setFidoError("Tarayıcınız WebAuthn'i desteklemiyor.");
            return;
        }

        try {
            // Sunucudan doğrulama seçeneklerini alın
            const response = await fetch(`http://localhost:8080/fido/authenticate/${formik.values.username}/options`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const options = await response.json();

            console.log("options", options);

            // Tarayıcı ile kimlik doğrulamasını başlat
            const asseResp = await startAuthentication(options);

            // Sunucuya doğrulama yanıtını gönderin
            const verificationResp = await fetch(`http://localhost:8080/fido/authenticate/${formik.values.username}/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(asseResp),
            });

            const verificationJSON = await verificationResp.json();

            console.log("verificationJSON", verificationJSON);

            if (verificationJSON.success) {
                localStorage.setItem("access_token", verificationJSON.access_token);
                navigate("/");
            } else {
                setFidoError("Kimlik doğrulama başarısız oldu.");
            }
        } catch (error) {
            setFidoError(`Hata: ${error.message}`);
        }
    };

    return (
        // Login Container
        <div className="login-container">
            <div className="login-form">
                <h2>Giriş Yap</h2>
                <div className="fido-switch">
                    <label>
                        <input
                            type="checkbox"
                            checked={fidoEnabled}
                            onChange={() => setFidoEnabled(!fidoEnabled)}
                        />
                        FIDO ile Giriş Yap
                    </label>
                </div>
                {fidoEnabled ? (
                    <>
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
                        <button type="button" onClick={handleFidoLogin}>
                            FIDO ile Giriş Yap
                        </button>
                        {fidoError && <p className="error-message">{fidoError}</p>}
                    </>
                ) : (
                    <form onSubmit={formik.handleSubmit}>
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
                        <button type="submit">Giriş Yap</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
