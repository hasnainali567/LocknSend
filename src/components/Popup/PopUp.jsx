import React, { useState } from "react";
import { Modal, Input, Button, Form, Switch } from "antd";
import "./style.scss";

const PopUp = ({ open, onClose, onSave }) => {
  const [form] = Form.useForm();
  const [password, setPassword] = useState("");
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
  const isValid = passwordRegex.test(password);

  const handleOk = async () => {
    if (!checked || isValid) {
      setSaving(true);

      try {
        await onSave(checked ? password : "");
      } catch (err) {
        setSaving(false);
      }
    }
  };

  const handleClose = () => {
    if (checked) {
      form.resetFields();
    }
    setPassword("");
    setChecked(false);
    onClose();
  };

  return (
    <Modal
      title={<p className='text-lg font-bold'>Save the Document</p>}
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key='cancel' onClick={handleClose}>
          Cancel
        </Button>,
        <Button
          key='submit'
          type='primary'
          onClick={handleOk}
          disabled={checked && !isValid}
          loading={saving}
        >
          Save
        </Button>,
      ]}
    >
      <div className='mb-3'>
        <span className='mr-2'>Add password?</span>
        <Switch checked={checked} onChange={(val) => setChecked(val)} />
      </div>

      {checked && (
        <Form form={form} layout='vertical' className='form'>
          <Form.Item
            className='form-item'
            label='Password'
            validateStatus={password && !isValid ? "error" : ""}
            help={
              password && !isValid
                ? "Min 6 chars, include 1 letter and 1 number"
                : ""
            }
          >
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter password'
            />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default PopUp;
