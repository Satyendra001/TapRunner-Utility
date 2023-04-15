import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { APICall } from '../utility/utils';
import { USER_SIGNUP } from '../utility/URL'
import { useNavigate } from "react-router-dom";

import Image from '../assets/bg2.jpg';
// import { RequireAuth } from "../utility/RequireAuth";
import { useContext } from 'react'



function Copyright(props) {
    return (
        <Typography variant="body2" color="text.secondary" align="center" {...props}>
            {'Copyright © '}
            <Link color="inherit" href="https://crestdatasys.com/">
                CrestDataSys
            </Link>{' '}
            {new Date().getFullYear()}
            {'.'}
        </Typography>
    );
}

const theme = createTheme();

export default function SignUp() {
    // const { user } = useContext(RequireAuth)
    // console.log('------->>+++++', user)
    const [error, setError] = React.useState({ "first_name": "", "last_name": "", "email": "", "password": "" })

    const navigate = useNavigate();

    const validate = (formData) => {
        let data = {
            first_name: formData.get("firstName") === "" ? "This field is required" : "",
            last_name: formData.get("lastName") === "" ? "This field is required" : "",
            email: formData.get("email") === "" ? "This field is required" : "",
            password: formData.get("password") === "" ? "This field is required" : "",
        }
        setError(data);
        return !(Boolean(data.first_name) || Boolean(data.last_name) || Boolean(data.email) || Boolean(data.password))

    }

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        if (!validate(formData)) { return }
        APICall({
            method: 'post',
            url: USER_SIGNUP,
            data: {
                firstName: formData.get("firstName"),
                lastName: formData.get("lastName"),
                email: formData.get('email'),
                password: formData.get('password'),
            },
            successCallBack: (data) => {
                console.log(data)
                if ("success" in data) {
                    navigate('/login')
                }

                else {
                    alert(data.error + "! Try again...")
                }
            }
        });
    };

    return (
        <ThemeProvider theme={theme} >
            <Container component="main" maxWidth="xs" >
                <CssBaseline />
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Sign up
                    </Typography>
                    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    error={error.first_name !== ""}
                                    helperText={error.first_name}
                                    autoComplete="given-name"
                                    name="firstName"
                                    required
                                    fullWidth
                                    id="firstName"
                                    label="First Name"
                                    autoFocus
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    error={error.last_name !== ""}
                                    helperText={error.last_name}
                                    required
                                    fullWidth
                                    id="lastName"
                                    label="Last Name"
                                    name="lastName"
                                    autoComplete="family-name"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    error={error.email !== ""}
                                    helperText={error.email}
                                    required
                                    fullWidth
                                    id="email"
                                    label="Email Address"
                                    name="email"
                                    autoComplete="email"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    error={error.password !== ""}
                                    helperText={error.password}
                                    required
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    type="password"
                                    id="password"
                                    autoComplete="new-password"
                                />
                            </Grid>

                        </Grid>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Sign Up
                        </Button>
                        <Grid container justifyContent="flex-end">
                            <Grid item>
                                <Link href="login/" variant="body2">
                                    Already have an account? Log in
                                </Link>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
                <Copyright sx={{ mt: 5 }} />
            </Container>
        </ThemeProvider>
    );
}