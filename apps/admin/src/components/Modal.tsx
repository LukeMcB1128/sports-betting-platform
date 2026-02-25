import React from 'react';
import styled from 'styled-components';
import { colors } from '../styles/GlobalStyles';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
`;

const Dialog = styled.div`
  background-color: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid ${colors.border};
`;

const DialogTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text};
`;

const CloseButton = styled.button`
  color: ${colors.textMuted};
  font-size: 20px;
  line-height: 1;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.15s;

  &:hover {
    color: ${colors.text};
  }
`;

const DialogBody = styled.div`
  padding: 20px;
`;

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => (
  <Overlay onClick={onClose}>
    <Dialog onClick={(e) => e.stopPropagation()}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <CloseButton onClick={onClose}>✕</CloseButton>
      </DialogHeader>
      <DialogBody>{children}</DialogBody>
    </Dialog>
  </Overlay>
);

export default Modal;
