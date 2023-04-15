import React, { useContext, createContext, useState, useEffect } from 'react';
import { Navigate, useNavigate } from "react-router-dom";
import Cookies from "universal-cookie";
import { JWT_TOKEN } from './URL';
import axios from 'axios';
import jwt_decode from "jwt-decode"

axios.defaults.withCredentials = true;

const RequireAuth = createContext();
export default RequireAuth;

export const RequireAuthProvider = ({ children }) => {
    const cookies = new Cookies();
    const navigate = useNavigate();

    const [authTokens, setAuthTokens] = useState(() => localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null)
    const [user, setUser] = useState(() => localStorage.getItem('authTokens') ? jwt_decode(localStorage.getItem('authTokens')) : null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    let loginUser = (e) => {
        e.preventDefault();
        axios({
            method: "post",
            url: JWT_TOKEN,
            data: {
                username: e.target.username.value,
                password: e.target.password.value,
            },
            headers: {
                "Content-Type": "application/json"
            },
        })
            .then((response) => {
                console.log("Success", response.data);
                setAuthTokens(response.data);
                setError(false);
                setUser(jwt_decode(response.data.access));
                localStorage.setItem('authTokens', JSON.stringify(response.data));
                navigate('/home');

            })
            .catch((error) => {
                setError(true);
                console.log("Error!", error.response);
            });
    }

    let logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        navigate('/login');
    }

    let updateToken = () => {
        if (authTokens) {
            console.log('Tokens Updated');
            axios({
                method: "post",
                url: JWT_TOKEN + '/refresh',
                data: {
                    refresh: authTokens.refresh
                },
                headers: {
                    "Content-Type": "application/json"
                },
            })
                .then((response) => {
                    console.log("Success", response.data);
                    setAuthTokens(response.data);
                    setUser(jwt_decode(response.data.access));
                    localStorage.setItem('authTokens', JSON.stringify(response.data));
                    // navigate('/tap')

                })
                .catch((error) => {
                    // logoutUser();
                    console.log("Error!", error.response);
                });
        }

        else { return }

        if (loading) {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (loading) { updateToken() }

        const fourmin = 1000 * 60 * 4;

        let interval = setInterval(() => {
            if (authTokens) { updateToken() }
        }, fourmin)

        return () => {
            clearInterval(interval)
        }
    }, [authTokens, loading])



    let contextData = {
        user: user,
        loading: loading,
        error: error,
        authTokens: authTokens,
        loginUser: loginUser,
        logoutUser: logoutUser,
    }

    return (
        <RequireAuth.Provider value={contextData}>
            {children}
        </RequireAuth.Provider>
    );
};
