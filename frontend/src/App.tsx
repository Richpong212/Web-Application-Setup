import React, { useEffect, useState } from 'react';
import { test } from './services/index.service';

type ApiStatus = {
  cached?: boolean;
  message?: string;
};

const App = () => {
  const [data, setData] = useState<ApiStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await test();
      setData(response);
      setError(null);
    } catch {
      setError('Unable to reach the API');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className='bg-gray-900 h-screen flex justify-center items-center flex-col'>
      <h1 className='text-3xl font-bold text-blue-600' > Welcome CodeGenitor</h1 >
      {error ? (
        <h2 className='text-2xl font-bold text-white' >{error}</h2>
      ) : (
        <>
          <h2 className='text-2xl font-bold text-white' >cached: {data?.cached ? 'true' : 'false'}</h2>
          <h2 className='text-2xl font-bold text-white' >message: {data?.message ?? 'Loading...'}</h2>
        </>
      )}
    </div >
  );
};

export default App;
