import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../auth/auth";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import "./home.css";

const Home = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [fidoError, setFidoError] = useState("");
    const [fidoSuccess, setFidoSuccess] = useState("");
    const [userId, setUserId] = useState("");

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const response = await fetch("http://localhost:8080/users/profile", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Kullanıcı bilgileri alınamadı");
                }

                const data = await response.json();
                setUserId(data._id);
                setUsername(data.name);
            } catch (error) {
                console.error("Kullanıcı bilgileri alınamadı: ", error);
                setUsername("Misafir");
            }
        };

        fetchUserData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleFidoRegistration = async () => {
        setFidoError("");
        setFidoSuccess("");

        if (!browserSupportsWebAuthn()) {
            setFidoError("Tarayıcınız WebAuthn'i desteklemiyor.");
            return;
        }

        try {
            // Sunucudan kayıt seçeneklerini alın
            const response = await fetch(`http://localhost:8080/fido/register/${userId}/options`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const options = await response.json();

            // Tarayıcı ile kaydı başlat
            const attResp = await startRegistration(options);

            // Sunucuya kayıt yanıtını gönderin
            const verificationResp = await fetch(`http://localhost:8080/fido/register/${userId}/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(attResp),
            });

            console.log(verificationResp);

            const verificationJSON = await verificationResp.json();

            if (verificationJSON.succes) {
                setFidoSuccess("Kayıt başarılı!");
            } else {
                setFidoError("Kayıt başarısız oldu.");
            }
        } catch (error) {
            setFidoError(`Hata: ${error.message}`);
        }
    };

    return (
        <div className="home-container">
            <div className="home-content">
                <h1>Hoş Geldiniz, {username}!</h1>
                <p>React uygulamamıza hoş geldiniz. Burada kişisel bilgilerinizi yönetebilir ve projelerinizi takip edebilirsiniz.</p>
                <button onClick={handleLogout}>Çıkış Yap</button>
                <button onClick={handleFidoRegistration}>FIDO ile Kayıt Ol</button>
                {fidoSuccess && <p className="success-message">{fidoSuccess}</p>}
                {fidoError && <p className="error-message">{fidoError}</p>}
            </div>
        </div>
    );
};

export default Home;
