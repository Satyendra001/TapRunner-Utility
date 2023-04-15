import swal from 'sweetalert';
import axios from 'axios';
axios.defaults.withCredentials = true;

export const SweetAlertPopUp = (params) => {
  swal({
    title: params.title,
    text: params.text,
    icon: params.icon,
    buttons: params.buttons,
  })
    .then((value) => {
      if (value) {
        params.yesOnClick();
      }
    });

}

export const APICall = (config) => {
  axios({
    method: config.method,
    url: config.url,
    data: config.data,
    headers: config.headers,
    params: config.params,
    // credentials: "same-origin"
  })
    .then((response) => {
      config.successCallBack(response.data.data);
      console.log("Success", response);
    })
    .catch((error) => {
      config.errorCallBack(error)
      console.log("Error!", error.response);
    });
}

