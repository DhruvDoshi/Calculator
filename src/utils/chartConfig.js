export const getDoughnutChartConfig = (invested, returns) => ({
  data: {
    labels: ['Invested amount', 'Est. returns'],
    datasets: [
      {
        data: [invested, returns],
        backgroundColor: ['#BFDBFE', '#3B82F6'],
        borderColor: ['#BFDBFE', '#3B82F6'],
        borderWidth: 1,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
    },
  },
});

export const getLineChartConfig = (netWorthData, currentYear, currencySymbol) => ({
  data: {
    labels: Array.from({ length: netWorthData.length }, (_, i) => currentYear + i + 1),
    datasets: [
      {
        label: 'Net Worth',
        data: netWorthData,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Net Worth Over Time',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Year',
        },
      },
      y: {
        title: {
          display: true,
          text: `Net Worth (${currencySymbol})`,
        },
        ticks: {
          callback: (value) => `${currencySymbol}${value.toLocaleString()}`,
        },
      },
    },
  },
});
