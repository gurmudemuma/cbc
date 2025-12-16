import { Button } from '@mui/material';

interface ContinueModalProps {
  onContinue: () => void;
  onStop: () => void;
}

const ContinueModal = ({ onContinue, onStop }: ContinueModalProps) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Continue with other pages?</h2>
        <p>Do you want to continue with the implementation of the other pages?</p>
        <div className="modal-actions">
          <Button variant="outlined" onClick={onStop}>
            Stop
          </Button>
          <Button variant="contained" onClick={onContinue}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContinueModal;
