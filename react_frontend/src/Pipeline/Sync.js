import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Dialog from '@mui/material/Dialog';
import DvrIcon from '@mui/icons-material/Dvr';
import Slide from '@mui/material/Slide';
import LinearProgress from '@mui/material/LinearProgress';
import { useState, useContext } from 'react';
import { SweetAlertPopUp, APICall } from '../utility/utils';
import { SYNC_RUN_URL, LOGS_URL } from '../utility/URL';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import CardContent from '@mui/material/CardContent';
import Tooltip from '@mui/material/Tooltip';
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import RequireAuth from '../utility/RequireAuth';


const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Sync = ({ pipeline, change }) => {
  const [is_error, setError] = useState(null);
  const [is_loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState([])
  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const { user } = useContext(RequireAuth);


  const runSync = () => {
    change(prevState => ({ ...prevState, state: false, field_selection: false }));
    const intervalID = setInterval(fetchLogs, 100);
    APICall({
      method: 'post',
      params: {
        instance_name: window.location.href.split("pipeline/")[1].split("/")[0],
        tap_name: window.location.href.split("pipeline/")[1].split("/")[1],
        with_state: pipeline.is_state,
        user: user.username
      },
      url: SYNC_RUN_URL,
      successCallBack: (data) => {
        change(prevState => ({ ...prevState, state: true, field_selection: true }));
        setLoading(false);
        setError(data.is_error);
        clearInterval(intervalID);
        fetchLogs();
        console.log("sync run");
      }
    });
  }

  const rerunClick = () => {
    SweetAlertPopUp({
      title: "Are you sure?",
      icon: "warning",
      buttons: ["No", "Yes"],
      yesOnClick: () => {
        setLoading(true);
        runSync();
      }
    });
  }

  const fetchLogs = () => {
    console.log("start_log");
    APICall({
      method: 'get',
      params: {
        instance_name: window.location.href.split("pipeline/")[1].split("/")[0],
        tap_name: window.location.href.split("pipeline/")[1].split("/")[1],
        user: user.username
      },
      url: LOGS_URL,
      successCallBack: (data) => {
        setLogs(data);
        console.log("end_log", data)
      }
    });
  }

  return (
    <>
      <div>
        <Card sx={{ maxWidth: 350, boxShadow: 5, borderRadius: '15px' }}>
          <CardHeader
            titleTypographyProps={{ fontSize: 18, color: pipeline.sync == false ? "" : "white" }}
            style={{ background: pipeline.sync == false ? "#2c2929" : "linear-gradient(28deg, rgb(28, 28, 28), transparent)" }}
            action={
              <>
                <Tooltip title="Re-run sync">
                  <IconButton aria-label="Re-run sync" disabled={!pipeline.sync} component="label" onClick={rerunClick}>
                    <RestartAltIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Show logs">
                  <IconButton aria-label="show logs" disabled={!pipeline.sync} component="label" onClick={handleClickOpen}>
                    <DvrIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Show Report">
                  <IconButton aria-label="Show Report" disabled={!pipeline.sync} component="label" onClick={() => window.open(`/pipeline/${window.location.href.split("pipeline/")[1].split("/")[0]}/${window.location.href.split("pipeline/")[1].split("/")[1]}/report`, '_blank', 'noopener,noreferrer')}>
                    <AssessmentOutlinedIcon />
                  </IconButton>
                </Tooltip>
                {/* <Tooltip title="Open sync.json">
              <IconButton aria-label="Open sync" disabled={!pipeline.sync} component="label" onClick={()=>window.open("/pipeline/sync", '_blank', 'noopener,noreferrer')}>
                <FileOpenOutlinedIcon />
              </IconButton>
            </Tooltip> */}
              </>
            }
            title="Sync"
          />
        </Card>
        {is_loading && <LinearProgress />}
        <Alert style={{ display: is_error != null && pipeline.sync && !is_loading && is_error ? "" : "none", background: "linear-gradient(45deg, #dda4a4, transparent)", borderRadius: '15px' }} severity="error">Sync mode is failing please check logs</Alert>
        <Alert style={{ display: is_error != null && pipeline.sync && !is_loading && !is_error ? "" : "none", background: "linear-gradient(45deg, #9bbf9b, transparent)", borderRadius: '15px' }} severity="success">Sync mode is successful</Alert>
        <Dialog
          fullScreen
          open={open}
          onClose={handleClose}
          TransitionComponent={Transition}
          PaperProps={{ sx: { height: 400, position: "absolute", bottom: 0, left: 0, backgroundColor: "black" } }}
        >
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar variant="dense">
              <Typography sx={{ ml: 2, flex: 1 }} variant="h7" component="div">
                Sync Logs
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

export default Sync