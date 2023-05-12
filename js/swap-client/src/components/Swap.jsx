import React from 'react';
import { Outlet } from 'react-router-dom';
import { Button, Header, Image, Modal, Form, TextArea } from 'semantic-ui-react'
import styles from './styles/Swap.module.css';

export const Swap = () => {

  return (
    <div className="App">
      <h3></h3>
      <Outlet />
    </div>
  );
}
