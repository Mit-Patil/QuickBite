package com.quickbite.user_service.dto;

import jakarta.validation.constraints.NotBlank;

public class AddressRequest {
    
    private String label;
    
    @NotBlank(message = "Address line is Required")
    private String addressLine;
    
    private String landmark;
    
    @NotBlank(message = "city is required")
    private String city;
    
    @NotBlank(message = "Pincode is required")
    private String pincode;
    
    private Double latitude;
    private Double longitude;
    private Boolean isDefault;

    public String getLabel() {
        return label;
    }
    
    public void setLabel(String label) {
        this.label = label;
    }

    public String getAddressLine() {
        return addressLine;
    }

    public void setAddressLine(String addressLine) {
        this.addressLine = addressLine;
    }

    public String getLandmark() {
        return landmark;
    }

    public void setLandmark(String landmark) {
        this.landmark = landmark;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }
    
    
    
}
