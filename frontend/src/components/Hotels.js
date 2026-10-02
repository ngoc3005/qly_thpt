import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export function Hotels() {
    const [hotels, setHotels] = useState([]);
    useEffect(() => {
        fetchHotels();
    }, []);
    const fetchHotels = async () => {
        try {
            const response = await fetch(process.env.REACT_APP_API_ADDRESS + "/api/hotel/getHotels");
            const data = await response.json();
            setHotels(data);
        } catch (error) {
            console.error('Error fetching hotels:', error);
        }
    };
    return (
        <div>
            <h1 className="text-center text-warning mt-3">All Hotels</h1>
            <div className="container mt-5">
                <div className="row gy-4">
                    {hotels.map((hotel) => (
                        <div key={hotel._id} className="col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm">
                                <img
                                    src={hotel.image || 'https://imgcld.yatra.com/ytimages/image/upload/t_seo_Hotel_w_930_h_550_c_fill_g_auto_q_40_f_jpg/v1390494345/Domestic%20Hotels/Hotels_Mysore/Hotel%20The%20President/Facade~904.jpg'}
                                    className="card-img-top"
                                    alt={hotel.name}
                                    style={{ objectFit: 'cover', height: '220px' }}
                                />
                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title">{hotel.name}</h5>
                                    <p className="card-text text-muted">{hotel.description || 'No description available.'}</p>
                                    <p className="mb-1"><strong>Location:</strong> {hotel.address}</p>
                                    <p className="mb-3"><strong>Contact:</strong> {hotel.contact}</p>
                                    <Link to={`/api/room/getRooms/${hotel._id}`} className="btn btn-warning mt-auto">Explore</Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
export default Hotels;
