import React, { useEffect, useState } from 'react';
import { test } from './services/index.service';

const App = () => {
  const [data, setData]: any = useState(null);
  console.log(data);

  const fetchData = async () => {
    const response = await test();
    setData(response);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className='bg-gray-900 h-screen flex justify-center items-center flex-col'>
      <h1 className='text-3xl font-bold text-blue-600' > Welcome CodeGenitor</h1 >
      <h2 className='text-2xl font-bold text-white' >cached: {data?.cached ? 'true' : 'false'}</h2>
      <h2 className='text-2xl font-bold text-white' >message: {data?.message}</h2>
    </div >
  );
};

export default App;
