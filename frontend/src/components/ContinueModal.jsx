import { useState } from 'react';

const ContinueModal = ({ onContinue, onStop }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Continue with other pages?</h2>
        <p>Do you want to continue with the implementation of the other pages?</p>
        <div className="modal-actions">
          <Button variant="outline" onClick={onStop}>Stop</Button>
          <Button variant="primary" onClick={onContinue}>Continue</Button>
        </div>
      </div>
    </div>
  );
};

export default ContinueModal;
