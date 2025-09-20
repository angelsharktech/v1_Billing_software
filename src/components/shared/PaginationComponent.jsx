import React from "react";
import { Pagination, Stack } from "@mui/material";

const PaginationComponent = ({ totalPages, currentPage, onPageChange }) => {
  const handleChange = (event, value) => {
    onPageChange(value);
  };

  return (
    <Stack spacing={2} alignItems="end" mt={1}>
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={handleChange}
        color="primary"
        shape="rounded"
        variant="outlined"
        showFirstButton
        showLastButton
      />
    </Stack>
  );
};

export default PaginationComponent;
