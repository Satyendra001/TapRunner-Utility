import React, { useContext } from "react";
import Button from '@mui/material/Button';
import { useState, useEffect } from 'react';
import { COMPARE_INSTANCES_URL } from '../utility/URL'
import { APICall, SweetAlertPopUp } from '../utility/utils';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import { useLocation, useOutletContext } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import RequireAuth from "../utility/RequireAuth";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        background: 'linear-gradient(to bottom, #434A50, grey)',
        color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,

    }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    'td': {
        border: "1px solid",
    },
}));

const style = {
    ul: {
        "padding-left": "0px",
        "list-style-position": "inside",
    }
}


const Compare = () => {
    const { pathname } = useLocation();
    const [compareReport, setCompareReport] = useState({});
    const [compare_open, setCompareOpen] = useState(false);
    const instances = pathname.split("/").pop().split("&");
    const { setTitle } = useOutletContext();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const [rotateChevron, setRotateChevron] = useState(false);
    const rotate = rotateChevron ? "rotate(100deg)" : "rotate(0)"
    const handleClick = (event) => { setAnchorEl(event.currentTarget); setRotateChevron(!rotateChevron); };
    const handleClose = () => { setAnchorEl(null); setRotateChevron(!rotateChevron); };
    const { user } = useContext(RequireAuth);

    const [columns_selection, setColumnSelection] = useState({
        "Primary Key": true,
        "Replication Key": true,
        "Replication Method": true,
        "Changed Fields": true,
        [`Fields only in ${instances[0]}`]: true,
        [`Fields only in ${instances[1]}`]: true,
        "Unchanged Fields": true

    })

    const RowCompare = ({ data, stream }) => {
        return (
            <React.Fragment>
                <StyledTableRow key={stream}>
                    <StyledTableCell align="center" scope="row">{stream}</StyledTableCell>

                    <StyledTableCell align="center" style={{ display: columns_selection["Primary Key"] ? "" : "none" }}>
                        <Table sx={{ align: "center" }}>
                            <TableBody>
                                {
                                    data.first_instance_pk.map(field => {
                                        return (
                                            <StyledTableRow align="center" key={field}>
                                                <StyledTableCell align="center">{field}</StyledTableCell>
                                            </StyledTableRow>

                                        )
                                    })

                                }
                            </TableBody>
                        </Table>
                    </StyledTableCell>

                    <StyledTableCell align="center" style={{ display: columns_selection["Primary Key"] ? "" : "none" }}>
                        <Table sx={{ align: "center" }}>
                            <TableBody>
                                {
                                    data.second_instance_pk.map(field => {
                                        return (
                                            <StyledTableRow key={field}>
                                                <StyledTableCell align="center">{field}</StyledTableCell>
                                            </StyledTableRow>

                                        )
                                    })

                                }
                            </TableBody>

                        </Table>
                    </StyledTableCell>

                    <StyledTableCell align="center" style={{ display: columns_selection["Replication Key"] ? "" : "none" }}>
                        <Table sx={{ align: "center" }}>
                            <TableBody>
                                {
                                    data.first_instance_rk.map(field => {
                                        return (
                                            <StyledTableRow key={field}>
                                                <StyledTableCell align="center">{field}</StyledTableCell>
                                            </StyledTableRow>

                                        )
                                    })

                                }
                            </TableBody>
                        </Table>
                    </StyledTableCell>

                    <StyledTableCell align="center" style={{ display: columns_selection["Replication Key"] ? "" : "none" }}>
                        <Table sx={{ align: "center" }}>
                            <TableBody>
                                {
                                    data.second_instance_rk.map(field => {
                                        return (
                                            <StyledTableRow key={field}>
                                                <StyledTableCell align="center">{field}</StyledTableCell>
                                            </StyledTableRow>

                                        )
                                    })

                                }
                            </TableBody>
                        </Table>
                    </StyledTableCell>

                    <StyledTableCell align="center" style={{ display: columns_selection["Replication Method"] ? "" : "none" }}>{data.first_instance_rm}</StyledTableCell>
                    <StyledTableCell align="center" style={{ display: columns_selection["Replication Method"] ? "" : "none" }}>{data.second_instance_rm}</StyledTableCell>

                    <StyledTableCell align="center" style={{ display: columns_selection["Changed Fields"] ? "" : "none" }}>
                        <div style={{ maxHeight: 220, overflowY: 'scroll' }}>
                            <Table sx={{ align: "center" }}>
                                <TableBody>
                                    {
                                        data.first_instance_field.map(field => {
                                            return (
                                                <StyledTableRow key={field.field}>
                                                    <StyledTableCell align="center">{field.field}</StyledTableCell>
                                                    <StyledTableCell align="left"><pre id="json">{JSON.stringify(field.type, undefined, 2)}</pre></StyledTableCell>
                                                </StyledTableRow>

                                            )
                                        })

                                    }
                                </TableBody>
                            </Table>
                        </div>
                    </StyledTableCell>

                    <StyledTableCell align="center" style={{ display: columns_selection["Changed Fields"] ? "" : "none" }}>
                        <div style={{ maxHeight: 220, overflowY: 'scroll' }}>
                            <Table sx={{ align: "center" }}>
                                <TableBody>
                                    {
                                        data.second_instance_field.map(field => {
                                            return (
                                                <StyledTableRow key={field.field}>
                                                    <StyledTableCell align="center">{field.field}</StyledTableCell>
                                                    <StyledTableCell align="left"><pre id="json">{JSON.stringify(field.type, undefined, 2)}</pre></StyledTableCell>
                                                </StyledTableRow>

                                            )
                                        })

                                    }
                                </TableBody>
                            </Table>
                        </div>
                    </StyledTableCell>


                    <StyledTableCell align="center" style={{ display: columns_selection[`Fields only in ${instances[0]}`] ? "" : "none" }}>
                        <div style={{ maxHeight: 220, overflowY: 'scroll' }}>
                            <Table sx={{ align: "center" }}>
                                <TableBody>
                                    {
                                        data.deprecating_fields.map(field => {
                                            return (
                                                <StyledTableRow key={field.field}>
                                                    <StyledTableCell align="center">{field.field}</StyledTableCell>
                                                    <StyledTableCell align="left"><pre id="json">{JSON.stringify(field.type, undefined, 2)}</pre></StyledTableCell>
                                                </StyledTableRow>

                                            )
                                        })

                                    }
                                </TableBody>
                            </Table>
                        </div>
                    </StyledTableCell>

                    <StyledTableCell align="center" style={{ display: columns_selection[`Fields only in ${instances[1]}`] ? "" : "none" }}>
                        <div style={{ maxHeight: 220, overflowY: 'scroll' }}>
                            <Table sx={{ align: "center" }}>
                                <TableBody>
                                    {
                                        data.newly_added_fields.map(field => {
                                            return (
                                                <StyledTableRow key={field.field}>
                                                    <StyledTableCell align="center">{field.field}</StyledTableCell>
                                                    <StyledTableCell align="left"><pre id="json">{JSON.stringify(field.type, undefined, 2)}</pre></StyledTableCell>
                                                </StyledTableRow>

                                            )
                                        })

                                    }
                                </TableBody>
                            </Table>
                        </div>
                    </StyledTableCell>

                    <StyledTableCell align="center" style={{ display: columns_selection["Unchanged Fields"] ? "" : "none" }}>
                        <div style={{ maxHeight: 220, overflowY: 'scroll' }}>
                            <Table sx={{ align: "center" }}>
                                <TableBody>
                                    {
                                        data.unchanged_fields.map(field => {
                                            return (
                                                <StyledTableRow key={field.field}>
                                                    <StyledTableCell align="center">{field.field}</StyledTableCell>
                                                    <StyledTableCell align="left"><pre id="json" >{JSON.stringify(field.type, undefined, 2)}</pre></StyledTableCell>
                                                </StyledTableRow>

                                            )
                                        })

                                    }
                                </TableBody>
                            </Table>
                        </div>
                    </StyledTableCell>

                </StyledTableRow>
            </React.Fragment>
        );
    }

    useEffect(() => {
        var instances = pathname.split("/").pop().split("&");
        setTitle(`Comparision beetween "${instances[0]}" and "${instances[1]}"`);
        APICall({
            method: 'post',
            url: COMPARE_INSTANCES_URL,
            data: {
                instance_1: instances[0],
                instance_2: instances[1],
                user: user.username
            },
            successCallBack: (data) => {
                setCompareReport(data);
            },
            errorCallBack: (error) => {
                console.log('*******----->', error)
                if (error.message == "Request failed with status code 404") {
                    SweetAlertPopUp({
                        title: "Json file not found",
                        text: error.response.data.message,
                        icon: 'warning',
                        buttons: [false, "Ok"],
                        yesOnClick: () => { }
                    })
                }
                console.log("Error in getInstances", error.response);
            }
        });

    }, []);

    return (
        <>
            <Box sx={{ mt: 1, ml: 1 }}>
                <Typography component="div">
                    Compare Report
                    <IconButton
                        color="inherit"
                        aria-label="expand row"
                        size="small"
                        onClick={() => setCompareOpen(!compare_open)}
                    >
                        {compare_open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                    <Tooltip title="Select Columns">
                        <IconButton style={{ transform: rotate, transition: "all 0.2s linear" }} onClick={handleClick} component="label" >
                            <SettingsOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                    <Menu
                        id="basic-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        MenuListProps={{
                            'aria-labelledby': 'basic-button',
                        }}
                    >
                        <FormGroup sx={{ ml: 1 }}>
                            <FormControlLabel disabled control={<Checkbox defaultChecked />} label="Stream" />
                            <FormControlLabel control={<Checkbox name="Primary Key" checked={columns_selection["Primary Key"]} onChange={(e) => { setColumnSelection(prevState => ({ ...prevState, [e.target.name]: e.target.checked })) }} />} label="Primary Key" />
                            <FormControlLabel control={<Checkbox name="Replication Key" checked={columns_selection["Replication Key"]} onChange={(e) => { setColumnSelection(prevState => ({ ...prevState, [e.target.name]: e.target.checked })) }} />} label="Replication Key" />
                            <FormControlLabel control={<Checkbox name="Replication Method" checked={columns_selection["Replication Method"]} onChange={(e) => { setColumnSelection(prevState => ({ ...prevState, [e.target.name]: e.target.checked })) }} />} label="Replication Method" />
                            <FormControlLabel control={<Checkbox name="Changed Fields" checked={columns_selection["Changed Fields"]} onChange={(e) => { setColumnSelection(prevState => ({ ...prevState, [e.target.name]: e.target.checked })) }} />} label="Changed Fields" />
                            <FormControlLabel control={<Checkbox name={`Fields only in ${instances[0]}`} checked={columns_selection[`Fields only in ${instances[0]}`]} onChange={(e) => { setColumnSelection(prevState => ({ ...prevState, [e.target.name]: e.target.checked })) }} />} label={`Fields only in ${instances[0]}`} />
                            <FormControlLabel control={<Checkbox name={`Fields only in ${instances[1]}`} checked={columns_selection[`Fields only in ${instances[1]}`]} onChange={(e) => { setColumnSelection(prevState => ({ ...prevState, [e.target.name]: e.target.checked })) }} />} label={`Fields only in ${instances[1]}`} />
                            <FormControlLabel control={<Checkbox name="Unchanged Fields" checked={columns_selection["Unchanged Fields"]} onChange={(e) => { setColumnSelection(prevState => ({ ...prevState, [e.target.name]: e.target.checked })) }} />} label="Unchanged Fields" />
                        </FormGroup>

                    </Menu>
                    <hr />
                </Typography>
                <Collapse in={compare_open} timeout="auto" unmountOnExit>
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 700 }} aria-label="customized table">
                            <TableHead>
                                <TableRow>
                                    <StyledTableCell align="center" style={{ border: "1px solid" }} rowSpan={2}>Stream</StyledTableCell>
                                    <StyledTableCell align="center" style={{ border: "1px solid", display: columns_selection["Primary Key"] ? "" : "none" }} colSpan={2}>Primary Key</StyledTableCell>
                                    <StyledTableCell align="center" style={{ border: "1px solid", display: columns_selection["Replication Key"] ? "" : "none" }} colSpan={2}>Replication Key</StyledTableCell>
                                    <StyledTableCell align="center" style={{ border: "1px solid", display: columns_selection["Replication Method"] ? "" : "none" }} colSpan={2}>Replication Method</StyledTableCell>
                                    <StyledTableCell align="center" style={{ border: "1px solid", display: columns_selection["Changed Fields"] ? "" : "none" }} colSpan={2}>Changed Fields</StyledTableCell>
                                    <StyledTableCell align="center" style={{ border: "1px solid", display: columns_selection[`Fields only in ${instances[0]}`] ? "" : "none" }} rowSpan={2}>{`Fields only in ${instances[0]}`}</StyledTableCell>
                                    <StyledTableCell align="center" style={{ border: "1px solid", display: columns_selection[`Fields only in ${instances[1]}`] ? "" : "none" }} rowSpan={2}>{`Fields only in ${instances[1]}`}</StyledTableCell>
                                    <StyledTableCell align="center" style={{ border: "1px solid", display: columns_selection["Unchanged Fields"] ? "" : "none" }} rowSpan={2}>Unchanged Fields</StyledTableCell>
                                </TableRow>
                                <TableRow>
                                    <StyledTableCell align="center" style={{ border: "1px solid", display: columns_selection["Primary Key"] ? "" : "none" }}  >{instances[0]}</StyledTableCell>
                                    <StyledTableCell align="center" style={{ border: "1px solid", display: columns_selection["Primary Key"] ? "" : "none" }} >{instances[1]}</StyledTableCell>

                                    <StyledTableCell align="center" style={{ border: "1px solid", display: columns_selection["Replication Key"] ? "" : "none" }} >{instances[0]}</StyledTableCell>
                                    <StyledTableCell align="center" style={{ border: "1px solid", display: columns_selection["Replication Key"] ? "" : "none" }} >{instances[1]}</StyledTableCell>

                                    <StyledTableCell align="center" style={{ border: "1px solid", display: columns_selection["Replication Method"] ? "" : "none" }} >{instances[0]}</StyledTableCell>
                                    <StyledTableCell align="center" style={{ border: "1px solid", display: columns_selection["Replication Method"] ? "" : "none" }} >{instances[1]}</StyledTableCell>

                                    <StyledTableCell align="center" style={{ border: "1px solid", display: columns_selection["Changed Fields"] ? "" : "none" }} >{instances[0]}</StyledTableCell>
                                    <StyledTableCell align="center" style={{ border: "1px solid", display: columns_selection["Changed Fields"] ? "" : "none" }} >{instances[1]}</StyledTableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.keys(compareReport).map((stream, id) => {
                                    return <RowCompare key={stream} data={compareReport[stream]} stream={stream} />
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Collapse>
            </Box>

        </>
    )
}

export default Compare;