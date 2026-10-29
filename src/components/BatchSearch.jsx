import { useState } from 'react';

function BatchSearch({ onSearch }) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault(); // stops the page from reloading on submit
    if (inputValue.trim() !== '') {
      onSearch(inputValue.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter batch ID (try 1, 2, or 3)"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  );
}

export default BatchSearch;