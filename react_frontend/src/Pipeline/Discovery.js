import { useState, useEffect, useContext } from 'react';
import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import LinearProgress from '@mui/material/LinearProgress';
import { SweetAlertPopUp, APICall } from '../utility/utils';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Slide from '@mui/material/Slide';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import CardContent from '@mui/material/CardContent';
import DvrIcon from '@mui/icons-material/Dvr';
import { DISCOVERY_RUN_URL, LOGS_URL } from '../utility/URL';
import Tooltip from '@mui/material/Tooltip';
import { useOutletContext } from "react-router-dom";
import RequireAuth from "../utility/RequireAuth";


const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Discover = ({ change }) => {

  const [is_error, setError] = useState(false);
  const { setTitle } = useOutletContext();
  const [is_loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState([])
  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const { user } = useContext(RequireAuth);




  const runDiscover = () => {
    const intervalID = setInterval(fetchLogs, 100);
    change(prevState => ({ ...prevState, state: false, field_selection: false, sync: false }));
    APICall({
      method: 'get',
      url: DISCOVERY_RUN_URL,
      params: {
        instance_name: window.location.href.split("pipeline/")[1].split("/")[0],
        tap_name: window.location.href.split("pipeline/")[1].split("/")[1],
        user: user.username,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      successCallBack: (data) => {
        clearInterval(intervalID);
        setLoading(false);
        setError(data.is_error);
        fetchLogs();
        data.is_error || change(prevState => ({ ...prevState, field_selection: true }))
      }
    });
  }

  const rerunClick = () => {
    SweetAlertPopUp({
      title: "Are you sure?",
      text: "Once it started, you will not be able to recover previously generated catalog!",
      icon: "warning",
      buttons: ["No", "Yes"],
      yesOnClick: () => {
        setLoading(true);
        runDiscover();
      }
    });
  }

  useEffect(() => {
    runDiscover();
  }, []);

  const fetchLogs = () => {
    APICall({
      method: 'get',
      url: LOGS_URL,
      params: {
        instance_name: window.location.href.split("pipeline/")[1].split("/")[0],
        tap_name: window.location.href.split("pipeline/")[1].split("/")[1],
        user: user.username
      },
      successCallBack: (data) => {
        setLogs(data);
      }
    });
  }


  return (
    <>
      <div>
        <Card sx={{ maxWidth: 350, boxShadow: 5, borderRadius: '15px' }}>
          <CardHeader
            titleTypographyProps={{ fontSize: 18, color: "white" }}
            style={{ background: "linear-gradient(28deg, rgb(28, 28, 28), transparent)" }}
            action={
              <>
                <Tooltip title="Re-run disocvery">
                  <IconButton aria-label="Re-run disocvery" disabled={is_loading} component="label" onClick={rerunClick}>
                    <RestartAltIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Show logs">
                  <IconButton aria-label="show logs" component="label" onClick={handleClickOpen}>
                    <DvrIcon />
                  </IconButton>
                </Tooltip>
              </>
            }
            title="Discovery     "
          />
        </Card>
        {is_loading && <LinearProgress />}
        {!is_loading && is_error && <Alert style={{ background: "linear-gradient(45deg, #dda4a4, transparent)", borderRadius: '15px' }} severity="error">Discover mode is failing please check logs</Alert>}
        {!is_loading && !is_error && <Alert style={{ background: "linear-gradient(45deg, #9bbf9b, transparent)", borderRadius: '15px' }} severity="success">Discover mode is successful</Alert>}
        <Dialog
          fullScreen
          open={open}
          onClose={handleClose}
          TransitionComponent={Transition}
          PaperProps={{ sx: { height: 400, position: "absolute", bottom: 0, left: 0, backgroundColor: "black" } }}
        >
          <AppBar sx={{ position: 'relative', background: 'linear-gradient(to bottom, #0A1F2A, #5BB4F3)' }}>
            <Toolbar variant="dense">
              <Typography sx={{ ml: 2, flex: 1 }} variant="h7" component="div">
                Discover Logs
              </Typography>
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleClose}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
          <Card sx={{ backgroundColor: "black" }}>
            <CardContent>
              <Typography variant="body2" color="white" component='div' sx={{ maxHeight: 300, overflow: 'auto' }}>
                <ol>
                  {
                    logs.map(function (log, idx) {
                      return <li key={idx} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}> {log}</li>
                    })
                  }
                </ol>
              </Typography>
            </CardContent>
          </Card>


        </Dialog>
      </div>
    </>
  );
}

export default Discover