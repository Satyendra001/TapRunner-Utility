import { useState, useEffect, useContext } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { APICall } from '../utility/utils';
import { LOGS_URL } from '../utility/URL';
import RequireAuth from '../utility/RequireAuth';




const Coverage = () => {
    const [logs, setLogs] = useState([]);
    const is_unittest = window.location.href.endsWith("Unit%20Tests");
    const { user } = useContext(RequireAuth);

    useEffect(() => {
        APICall({
            method: 'get',
            url: LOGS_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            params: {
                instance_name: window.location.href.split("coverage/")[1].split("/")[0],
                tap_name: window.location.href.split("coverage/")[1].split("/")[1],
                file: window.location.href.split("coverage/")[1].split("/")[2],
                user: user.username
            },
            successCallBack: (data) => {
                console.log('Coverage data ---> ', data)
                setLogs(data)
            }
        });
    }, []);

    return (
        <>
            <Card sx={{ backgroundColor: "black" }}>
                <CardContent>
                    <Typography variant="body2" color="white" component='div' sx={{ overflow: 'auto' }}>
                        <ul>
                            {
                                logs.map(function (log, idx) {
                                    return <li key={idx} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}> {log}</li>
                                })
                            }
                        </ul>
                    </Typography>
                </CardContent>
            </Card>
        </>
    )
}

export default Coverage