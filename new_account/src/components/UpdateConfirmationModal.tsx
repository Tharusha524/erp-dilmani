import { ReactNode } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import CustomButton from "./CustomButton";

const useStyles = makeStyles(() => ({
  okBtn: {
    paddingLeft: "1rem",
    paddingRight: "1rem",
  },
}));

interface Props {
  open: boolean;
  title: string;
  content: any;
  onSuccess?: () => void;
  handleClose: () => void;
  customButtonText?: string;
  customButtonIcon?: ReactNode;
  buttonDisabled?: boolean;
}

const UpdateConfirmationModal = ({
  open,
  title,
  content,
  handleClose,
  onSuccess = () => {},
  customButtonText,
  customButtonIcon,
  buttonDisabled,
}: Props) => {
  const classes = useStyles();

  const handleOk = () => {
    handleClose();
    onSuccess();
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      onClose={handleClose}
      aria-labelledby={title + "-dialog"}
    >
      <DialogTitle id={title + "-dialog"}>
        {title}
      </DialogTitle>

      <DialogContent dividers>
        <DialogContentText>
          {content}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <CustomButton
          variant="contained"
          onClick={handleOk}
          disabled={buttonDisabled}
          className={classes.okBtn}
          startIcon={customButtonIcon}
        >
          {customButtonText || "OK"}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateConfirmationModal;
