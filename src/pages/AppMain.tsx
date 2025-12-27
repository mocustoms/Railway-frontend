import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GridLayout from '../components/GridLayout';
import Card from '../components/Card';
import { getFlaticonIcon } from '../utils/flaticonMapping';

const AppMain: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Application cards matching Sales module design
  const applicationCards = [
    {
      id: 'back-office',
      title: 'Back Office',
      description: 'Manage your business operations, inventory, products, and administrative tasks',
      icon: getFlaticonIcon('Building'),
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      href: '/dashboard'
    },
    {
      id: 'point-of-sale',
      title: 'Point of Sale',
      description: 'Process sales transactions, manage orders, and handle customer payments',
      icon: getFlaticonIcon('CreditCard'),
      iconBgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      href: '/pos/select-store'
    },
    {
      id: 'accounts',
      title: 'Accounts',
      description: 'Manage financial accounts, chart of accounts, and accounting operations',
      icon: getFlaticonIcon('BookOpen'),
      iconBgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      href: '/app-accounts'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Applications Grid */}
        <div className="mb-8">
          <GridLayout cols={4} gap={6} className="product-grid-animation">
            {applicationCards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                <Card
                  key={card.id}
                  title={card.title}
                  description={card.description}
                  icon={IconComponent}
                  iconBgColor={card.iconBgColor}
                  iconColor={card.iconColor}
                  onClick={() => navigate(card.href)}
                  className="product-card-animation"
                  animationDelay={index}
                />
              );
            })}
          </GridLayout>
        </div>
      </main>
    </div>
  );
};

export default AppMain;