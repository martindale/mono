export const SWAP_STATUS = ['', 
  'Submitting order', 
  'Finding match', 
  'Order matched', 
  'Finalizing order', 
  'Completed'
];

export const getStringFromDate = (date) => {
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return month[date.month] + ' ' + date.day + ', ' + (date.year - 2000);
}
