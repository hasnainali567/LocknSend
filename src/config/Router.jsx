import React from 'react'
import { Route, Routes } from 'react-router-dom';
import { Home } from '../pages';
import { AppLayout } from '../components';

const AppRouter = () => {
  return (
    <Routes>
        <Route path='/' element={<AppLayout><Home /></AppLayout>} />
        <Route path='/how-it-works' element={<AppLayout><Home /></AppLayout>} />
        <Route path='/upgrade' element={<AppLayout><Home /></AppLayout>} />
        <Route path='/feedback' element={<AppLayout><Home /></AppLayout>} />
        <Route path='/login-register' element={<AppLayout><Home /></AppLayout>} />
    </Routes>

  )
}

export default AppRouter;