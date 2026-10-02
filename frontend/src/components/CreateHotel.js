import React, { useState } from 'react';

export const CreateHotel = ({ showAlert }) => {
  const [hotel, setHotel] = useState({
    name: '',
    description: '',
    email: '',
    address: '',
    contact: '',
    image: ''
  });

  const onChange = (e) => {
    setHotel({ ...hotel, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(process.env.REACT_APP_API_ADDRESS + '/api/hotel/createHotel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(hotel)
      });
      const json = await response.json();
      if (response.ok) {
        showAlert('success', 'Hotel created successfully');
        setHotel({ name: '', description: '', email: '', address: '', contact: '', image: '' });
      } else {
        showAlert('danger', json.error || json.errors || 'Unable to create hotel');
      }
    } catch (error) {
      console.error('Error creating hotel:', error);
      showAlert('danger', 'Server error while creating hotel');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-4">Create Hotel</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Hotel Name</label>
                  <input type="text" className="form-control" id="name" name="name" value={hotel.name} onChange={onChange} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea className="form-control" id="description" name="description" rows="3" value={hotel.description} onChange={onChange} />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input type="email" className="form-control" id="email" name="email" value={hotel.email} onChange={onChange} required />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="address" className="form-label">Address</label>
                    <input type="text" className="form-control" id="address" name="address" value={hotel.address} onChange={onChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="contact" className="form-label">Contact</label>
                    <input type="text" className="form-control" id="contact" name="contact" value={hotel.contact} onChange={onChange} required />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="image" className="form-label">Image URL</label>
                  <input type="url" className="form-control" id="image" name="image" value={hotel.image} onChange={onChange} placeholder="https://example.com/photo.jpg" />
                </div>
                <button type="submit" className="btn btn-warning w-100">Create Hotel</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateHotel;
