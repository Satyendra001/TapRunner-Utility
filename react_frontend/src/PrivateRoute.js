import React, { useContext } from 'react'
import RequireAuth from './utility/RequireAuth'
import { Navigate } from 'react-router-dom'



const PrivateRoute = ({ children }) => {
    let { user } = useContext(RequireAuth);
    return (
        <>
            {!user ? <Navigate to='/login' /> : children}

        </>
    )

}



export default PrivateRoute