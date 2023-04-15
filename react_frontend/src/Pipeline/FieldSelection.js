import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { useState, useContext } from 'react';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { MultiSelect } from "react-multi-select-component";
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import { APICall, SweetAlertPopUp } from '../utility/utils';
import { CATALOG_FETCH_URL, CATALOG_SUBMIT_URL } from '../utility/URL';
import FlatList from 'flatlist-react';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import RequireAuth from '../utility/RequireAuth';


const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const FieldSelection = ({ pipeline, change }) => {
  const [catalog, setCatalog] = useState({});
  const [selected_stream, setStreamSelection] = useState({});
  const [open, setOpen] = useState(false);
  const { user } = useContext(RequireAuth);


  const handleClickOpen = () => {
    APICall({
      method: 'get',
      url: CATALOG_FETCH_URL,
      params: {
        instance_name: window.location.href.split("pipeline/")[1].split("/")[0],
        tap_name: window.location.href.split("pipeline/")[1].split("/")[1],
        user: user.username
      },
      data: { "name": "catalog" },
      successCallBack: (data) => {
        Object.keys(data).map(x => {
          selected_stream[x] = data[x].preSelected
        });
        setStreamSelection({ ...selected_stream });
        setCatalog({ ...data })
        setOpen(true);
        console.log("Fetch catalog");
      }
    });
  };

  const handleClose = () => {
    setOpen(false);
  };

  const submitSelection = () => {
    change(prevState => ({ ...prevState, state: false, sync: false }));
    APICall({
      method: 'post',
      url: CATALOG_SUBMIT_URL,
      params: {
        instance_name: window.location.href.split("pipeline/")[1].split("/")[0],
        tap_name: window.location.href.split("pipeline/")[1].split("/")[1],
        user: user.username
      },
      data: { "data": JSON.stringify(selected_stream) },
      successCallBack: (data) => {
        SweetAlertPopUp({
          title: "Catalog has been updated",
          icon: "success",
          buttons: [false, "Yes"],
          yesOnClick: () => { change(prevState => ({ ...prevState, state: true })); setOpen(false); }
        });
        console.log("Created catalog");
      }
    });
  }

  const RenderCatalog = (stream, idx) => {
    let { Fields } = catalog[stream];
    return (
      <Grid container spacing={2} key={idx}>
        <Grid item xs={2}>
          <FormGroup aria-label="position" row>
            <FormControlLabel
              control={
                <Checkbox
                  color="default"
                  checked={Boolean(selected_stream[stream].length === catalog[stream].Fields.length)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setStreamSelection(prevState => ({ ...prevState, [stream]: catalog[stream].Fields }));
                    }
                    else {
                      setStreamSelection(prevState => ({ ...prevState, [stream]: [] }));
                    }
                  }}
                  name={stream} />
              }
              label={stream}
            />
          </FormGroup>

        </Grid>

        <Grid item xs={10}>
          <MultiSelect
            id={stream}
            options={Fields}
            value={Boolean(selected_stream[stream]) ? selected_stream[stream] : []}
            onChange={(e, i) => {
              // if(e.length < catalog[stream].Fields.length){
              //   setStreams(prevState=>({...prevState, [stream]: false}));
              // }
              // else{
              //   setStreams(prevState=>({...prevState, [stream]: true}));
              // }
              selected_stream[stream] = e
              return setStreamSelection({ ...selected_stream })
            }}
            labelledBy={stream}
          />
        </Grid>
      </Grid>
    );
  }

  return (
    <>
      <Card sx={{ maxWidth: 350, boxShadow: 5, borderRadius: '15px' }}>
        <CardHeader
          titleTypographyProps={{ fontSize: 18, color: pipeline.field_selection == false ? "" : "white" }}
          style={{ background: pipeline.field_selection == false ? "#2c2929" : "linear-gradient(28deg, rgb(28, 28, 28), transparent)" }}
          action={
            <>
              <Tooltip title="Select fields">
                <IconButton aria-label="Re-run disocver mode" disabled={!pipeline.field_selection} component="label" onClick={handleClickOpen}>
                  <ListAltIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Open catalog.json">
                <IconButton aria-label="Open catalogs" disabled={!pipeline.field_selection} component="label" onClick={() => window.open(`/pipeline/${window.location.href.split("pipeline/")[1].split("/")[0]}/${window.location.href.split("pipeline/")[1].split("/")[1]}/catalog`, '_blank', 'noopener,noreferrer')}>
                  <FileOpenOutlinedIcon />
                </IconButton>
              </Tooltip>
            </>
          }
          title="Catalog"
        />
      </Card>

      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
        fullWidth
        maxWidth="xl"
        PaperProps={{ sx: { height: 500 } }}
      >
        <DialogTitle style={{ background: 'linear-gradient(to bottom, #0A1F2A, #5BB4F3)', color: "white" }}>Field Selection for Sync</DialogTitle>

        <DialogContent>
          <FormGroup aria-label="position" row>
            <FormControlLabel
              control={
                <Checkbox
                  color="default"
                  checked={Object.keys(catalog).every(stream => selected_stream[stream].length === catalog[stream].Fields.length)}
                  onChange={(e) => {
                    Object.keys(catalog).map(x => {
                      if (e.target.checked) {
                        selected_stream[x] = catalog[x].Fields;
                      }
                      else {
                        selected_stream[x] = [];
                      }
                    });
                    setStreamSelection({ ...selected_stream });

                  }}
                  name="Select All" />
              }
              label="Select All"
            />
          </FormGroup>
          <div>
            <FlatList
              list={Object.keys(catalog)}
              renderItem={RenderCatalog}
              renderWhenEmpty={() => <div>List is empty!</div>}
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ pl: "24px", pr: "24px" }}>
          <Button variant="contained" sx={{ background: "linear-gradient(rgb(10, 31, 42), rgb(91, 180, 243))", borderRadius: "150px 0 0 150px" }} onClick={handleClose}>Cancel</Button>
          <Button variant="contained" sx={{ background: "linear-gradient(rgb(10, 31, 42), rgb(91, 180, 243))", borderRadius: "0 150px 150px 0" }} onClick={submitSelection}>Submit</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default FieldSelection
