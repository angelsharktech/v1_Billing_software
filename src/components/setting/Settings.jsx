import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  Avatar,
  Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import { getOrganizationById } from "../../services/Organization";
import EditSetting from "./EditSetting";
import moment from "moment";

const Settings = () => {
  const { webuser } = useAuth();
  const [mainUser, setMainUser] = useState();
  const [edit, setEdit] = useState(false);
  const [data, setData] = useState();
  const [formData, setFormData] = useState({
    _id: "",
    name: "",
    phone_number: "",
    address: "",
    logo: "",
    updated:""
  });
  const [gstDetails, setGstDetails] = useState({
    gstNumber: "",
    legalName: "",
    state: "",
    stateCode: "",
  });

  useEffect(() => {
    fetchOrganization();
  }, [webuser]);

  const fetchOrganization = async () => {
    const res = await getUserById(webuser.id);
    setMainUser(res);
    const result = await getOrganizationById(res.organization_id._id);
    setFormData({
      _id: result._id,
      name: result.name || "",
      phone_number: result.phone_number || "",
      address: result.address || "",
      logo: result.logo
        ? `${import.meta.env.VITE_API_BASE_URL}${result.logo?.replace(
            /\\/g,
            "/"
          )}`
        : "",
        updated: result.updated_at
    });
    setGstDetails({
      gstNumber: result.gstDetails?.gstNumber || "",
      legalName: result.gstDetails?.legalName || "",
      state: result.gstDetails?.state || "",
      stateCode: result.gstDetails?.stateCode || "",
    });
  };
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

 
  const handleEdit = () => {
    const mergedData = {
      ...formData, // spread all shop details
      gstDetails: gstDetails, // add all gst details
    };

    setData(mergedData);
    setEdit(true);
  };
  const handleCloseEdit = () => setEdit(false);
  return (
    <>
      <Box
        sx={{
          p: { xs: 2, sm: 4 },
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            maxWidth: 700,
            width: "100%",
          }}
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            🏪 Shop Details
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid container spacing={2}>
              {/* Left Column */}
              <Grid item xs={12} sm={6}>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Box display="flex">
                    <Typography sx={{ fontWeight: "bold", width: 200 }}>
                      Shop Name:
                    </Typography>
                    <Typography>{formData?.name || "-"}</Typography>
                  </Box>

                  <Box display="flex">
                    <Typography sx={{ fontWeight: "bold", width: 200 }}>
                      Mobile:
                    </Typography>
                    <Typography>{formData?.phone_number || "-"}</Typography>
                  </Box>

                  <Box display="flex">
                    <Typography sx={{ fontWeight: "bold", width: 200 }}>
                      Address:
                    </Typography>
                    <Typography sx={{ whiteSpace: "pre-line" }}>
                      {formData?.address || "-"}
                    </Typography>
                  </Box>

                  <Box display="flex">
                    <Typography sx={{ fontWeight: "bold", width: 200 }}>
                      GST Number:
                    </Typography>
                    <Typography>{gstDetails?.gstNumber || "-"}</Typography>
                  </Box>

                  <Box display="flex">
                    <Typography sx={{ fontWeight: "bold", width: 200 }}>
                      Business Name:
                    </Typography>
                    <Typography>{gstDetails?.legalName || "-"}</Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Right Column */}
              <Grid item xs={12} sm={6}>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Box display="flex">
                    <Typography sx={{ fontWeight: "bold", width: 200 }}>
                      GST State:
                    </Typography>
                    <Typography>{gstDetails?.state || "-"}</Typography>
                  </Box>

                  <Box display="flex">
                    <Typography sx={{ fontWeight: "bold", width: 200 }}>
                      State Code:
                    </Typography>
                    <Typography>{gstDetails?.stateCode || "-"}</Typography>
                  </Box>

                  <Box display="flex" alignItems="center">
                    <Typography sx={{ fontWeight: "bold", width: 200 }}>
                      Logo:
                    </Typography>
                    {formData?.logo ? (
                      <Avatar
                        src={formData.logo}
                        alt="Organization Logo"
                        sx={{
                          width: 100,
                          height: 100,
                          border: "1px solid #ccc",
                        }}
                      />
                    ) : (
                      <Typography>-</Typography>
                    )}
                  </Box>

                  <Box display="flex">
                    <Typography sx={{ fontWeight: "bold", width: 200 }}>
                      Last Updated:
                    </Typography>
                    <Typography>{moment(formData?.updated).format('DD/MM/YYYY') || "-"}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Edit Button */}
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{
                background: "#182848",
                textTransform: "none",
                px: 3,
                py: 1,
                borderRadius: 2,
              }}
            >
              Edit Shop Details
            </Button>
          </Box>
        </Paper>
      </Box>
      <EditSetting
        edit={edit}
        data={data}
        handleCloseEdit={handleCloseEdit}
        refresh={fetchOrganization}
      />
    </>
  );
};

export default Settings;
