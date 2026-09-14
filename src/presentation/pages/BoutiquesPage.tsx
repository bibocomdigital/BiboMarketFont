import React from 'react';
import Shops from '@/components/Shops';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const BoutiquesPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Shops />
      </main>
      <Footer />
    </div>
  );
};

export default BoutiquesPage;