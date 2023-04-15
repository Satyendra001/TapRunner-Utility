import { useState, useEffect, useContext } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { APICall } from '../utility/utils';
import { FILE_SHOW_URL } from '../utility/URL';
import RequireAuth from '../utility/RequireAuth';


const ShowFile = () => {
  const [file, setFile] = useState({});
  const { user } = useContext(RequireAuth);


  useEffect(() => {
    APICall({
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        instance_name: window.location.href.split("pipeline/")[1].split("/")[0],
        tap_name: window.location.href.split("pipeline/")[1].split("/")[1],
        user: user.username
      },
      url: FILE_SHOW_URL + window.location.href.split("pipeline/")[1].split("/")[2],
      successCallBack: (data) => {
        setFile(data)
      }
    });
  }, []);

  return (
    <Card sx={{ backgroundColor: "black" }}>
      <CardContent>
        <Typography variant="body2" color="white" component='div' sx={{ overflow: 'auto' }}>
          <pre id="json">
            {JSON.stringify(file, undefined, 2)}

          </pre>
        </Typography>
      </CardContent>
    </Card>
  )
}

export default ShowFile