import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const PopularHotels = () => {
    const [popularHotels, setPopularHotels] = useState([]);

    useEffect(() => {
        fetchPopularHotels();
    }, []);

    const fetchPopularHotels = async () => {
        try {
            const response = await fetch(process.env.REACT_APP_API_ADDRESS + '/api/hotel/getHotels');
            const data = await response.json();
            setPopularHotels(data);
        } catch (error) {
            console.error('Error fetching popular hotels:', error);
        }
    };

    return (
        <div className="container mt-5">
            <h1 className="text-center text-warning mt-3">Popular Hotels</h1>
            <div className="row mt-5 gy-4">
                {popularHotels.map((hotel) => (
                    <div key={hotel._id} className="col-md-6 col-lg-4">
                        <div className="card h-100 shadow-sm">
                            <img
                                src={hotel.image}
                                className="card-img-top"
                                alt={hotel.name}
                                style={{ objectFit: 'cover', height: '220px' }}
                            />
                            <div className="card-body d-flex flex-column">
                                <h5 className="card-title">{hotel.name}</h5>
                                <p className="card-text text-muted">{hotel.description || 'No description available.'}</p>
                                <p className="mb-1"><strong>Location: </strong> {hotel.address}</p>
                                <p className="mb-1"><strong>Contact: </strong> {hotel.contact || 0}</p>
                                <Link to={`/api/room/getRooms/${hotel._id}`} className="btn btn-warning mt-auto">Book Room</Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default PopularHotels;