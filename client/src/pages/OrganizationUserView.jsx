import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import organizationService from "../services/organizationService";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";

const OrganizationUserView = ({ isPending = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [fileError, setFileError] = useState(null);

  useEffect(() => {
    const fetchOrganizationDetails = async () => {
      try {
        setLoading(true);

        const response = await organizationService.getOrganizationById(id);

        setOrganization(response.data);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to fetch organization details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationDetails();
  }, [id]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    // Validate if file exists
    if (!file) {
      setFileError("Please select a file");
      setPdfFile(null);
      return;
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      setFileError("Please upload a PDF file");
      setPdfFile(null);
      return;
    }

    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError("File size must be less than 5MB");
      setPdfFile(null);
      return;
    }

    setFileError(null);
    setPdfFile(file);
  };

  const handleDelete = async () => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "This will permanently delete this organization. This action cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        await organizationService.deleteOrganization(id);

        Swal.fire(
          "Deleted!",
          "Your organization registration has been deleted.",
          "success"
        );

        // Redirect to home page after deletion
        navigate("/");
      }
    } catch (err) {
      console.error("Error deleting organization:", err);
      Swal.fire(
        "Error!",
        "Failed to delete organization. Please try again.",
        "error"
      );
    }
  };

  const handleSubmitToOrganization = async () => {
    try {
      setSubmitting(true);

      // Validate that PDF is uploaded
      if (!pdfFile) {
        Swal.fire({
          title: "Required Document Missing",
          text: "Please upload a signed PDF document from the head of the organization",
          icon: "error",
        });
        setSubmitting(false);
        return;
      }

      const result = await Swal.fire({
        title: "Submit Organization?",
        text: "This will submit your organization for review. Are you sure you want to proceed?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, submit it!",
      });

      if (result.isConfirmed) {
        let documentPdfUrl = "";

        // Upload PDF to Firebase
        try {
          const fileName = `organizations/${id}/documents/${Date.now()}_${
            pdfFile.name
          }`;
          const storageRef = ref(storage, fileName);
          await uploadBytes(storageRef, pdfFile);
          documentPdfUrl = await getDownloadURL(storageRef);
        } catch (error) {
          console.error("Error uploading document:", error);
          Swal.fire({
            title: "Upload Failed",
            text: "Failed to upload document. Please try again.",
            icon: "error",
          });
          setSubmitting(false);
          return;
        }

        // Format the data for organization update
        const organizationData = {
          province: organization.province,
          district: organization.district,
          institutionName: organization.institution_name,
          websiteUrl: organization.website_url,
          personalDetails: {
            name: organization.name,
            designation: organization.designation,
            email: organization.email,
            contactNumber: organization.contact_number,
          },
          organizationLogoUrl: organization.organization_logo,
          profileImageUrl: organization.profile_image,
          // Only include services if they actually exist and have valid data
          services:
            organization.services &&
            organization.services[0] &&
            organization.services[0] !== null &&
            organization.services[0].serviceName
              ? organization.services
              : [],
          documentpdf: documentPdfUrl, // Add the document PDF URL (lowercase to match backend)
          isSubmitted: true, // Update the isSubmitted field to true
          status: "pending", // Set the status to pending
        };

        // Update the organization with isSubmitted = true
        await organizationService.updateOrganization(id, organizationData);

        Swal.fire(
          "Submitted!",
          "Your organization has been submitted for review.",
          "success"
        );

        // Navigate to home page after submission
        navigate("/");
      }
    } catch (err) {
      console.error("Error submitting organization:", err);
      Swal.fire(
        "Error!",
        "Failed to submit organization. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusMessage = () => {
    if (!organization) return null;

    if (isPending) {
      return (
        <div className="mb-6 p-4 rounded-md border bg-blue-50 border-blue-200">
          <div className="text-blue-700">
            <h3 className="font-medium">Organization awaiting submission</h3>
            <p className="mt-1 text-sm">
              This organization is saved as a draft. Click "Download PDF" to download the generated document, print it, and have it signed by the head of your organization. Then, upload the signed PDF below and submit your registration for review.
            </p>

            <div className="my-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Documents
              </h3>
              {organization.pdf_firebase_url ? (
                <div className="border rounded-md p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Organization Document</p>
                      <p className="text-sm text-gray-500">
                        Download this pdf, print it, and sign it. Then upload the signed document below.
                      </p>
                    </div>
                    <a
                      href={organization.pdf_firebase_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Download PDF
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">
                  No documents available for this organization
                </p>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      switch (organization.status) {
        case "pending":
          return (
            <div className="mb-6 p-4 rounded-md border bg-yellow-50 border-yellow-200">
              <div className="text-yellow-700">
                <h3 className="font-medium">
                  Your organization registration is pending approval
                </h3>
                <p className="mt-1 text-sm">
                  Our admin team is reviewing your application. You can still
                  edit your information while it's pending.
                </p>
              </div>
            </div>
          );
        case "approved":
          return (
            <div className="mb-6 p-4 rounded-md border bg-green-50 border-green-200">
              <div className="text-green-700">
                <h3 className="font-medium">
                  Your organization registration has been approved!
                </h3>
                <p className="mt-1 text-sm">
                  Your organization is now listed in our directory.
                </p>
              </div>
            </div>
          );
        case "rejected":
          return (
            <div className="mb-6 p-4 rounded-md border bg-red-50 border-red-200">
              <div className="text-red-700">
                <h3 className="font-medium">
                  Your organization registration was not approved
                </h3>
                <p className="mt-1 text-sm">
                  Please contact our support team for more information.
                </p>
              </div>
            </div>
          );
        default:
          return null;
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="text-red-500">
                {error || "Organization not found"}
              </div>
              <button
                onClick={() => navigate("/")}
                className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/")}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                {organization?.institution_name}
              </h1>
              {isPending && (
                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                  Draft
                </span>
              )}
            </div>
            <div className="space-x-2">
              {isPending && (
                <button
                  onClick={handleSubmitToOrganization}
                  disabled={submitting}
                  className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
                    submitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {submitting ? "Submitting..." : "Submit Organization"}
                </button>
              )}
              {organization?.status === "pending" && (
                <>
                  <button
                    onClick={() =>
                      navigate(
                        isPending
                          ? `/pending-organizations/${id}/edit`
                          : `/organizations/${id}/edit`
                      )
                    }
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6 flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/2">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Organization Logo
                </h3>
                <div className="border rounded-md p-4 flex justify-center items-center bg-gray-50 h-64">
                  {organization.organization_logo ? (
                    <img
                      src={organization.organization_logo}
                      alt="Organization Logo"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/gic-logo.png";
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <p className="mt-2">No logo available</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full md:w-1/2">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Contact Person
                </h3>
                <div className="border rounded-md p-4 flex flex-col items-center bg-gray-50 h-64">
                  {organization.profile_image ? (
                    <img
                      src={organization.profile_image}
                      alt="Contact Person"
                      className="max-h-48 max-w-full object-contain mb-2"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
                      }}
                    />
                  ) : (
                    <div className="h-48 w-48 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-24 w-24 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  <p className="font-medium text-center">{organization.name}</p>
                  <p className="text-sm text-gray-500 text-center">
                    {organization.designation}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Organization Details
                </h2>
                {getStatusBadge(organization.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Institution Information
                  </h3>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    <div>
                      <span className="font-medium">Province:</span>{" "}
                      {organization.province}
                    </div>
                    <div>
                      <span className="font-medium">District:</span>{" "}
                      {organization.district}
                    </div>
                    {organization.website_url && (
                      <div>
                        <span className="font-medium">Website:</span>{" "}
                        <a
                          href={organization.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {organization.website_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Contact Information
                  </h3>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    <div>
                      <span className="font-medium">Contact Person:</span>{" "}
                      {organization.name}
                    </div>
                    <div>
                      <span className="font-medium">Designation:</span>{" "}
                      {organization.designation}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {organization.email}
                    </div>
                    <div>
                      <span className="font-medium">Contact Number:</span>{" "}
                      {organization.contact_number}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {getStatusMessage()}

            {isPending && (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Required Document
                  </h3>
                  <div className="border-2 border-blue-100 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="mb-5">
                      <div className="flex items-center mb-3">
                        <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-800 font-medium">
                          Please upload a signed PDF document from the head of the
                          organization to verify this submission
                        </p>
                      </div>
                      <div className="ml-7">
                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                          The document should be on official letterhead, signed by
                          the head of the organization, and confirm the details
                          provided in this registration.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label
                        htmlFor="pdf-upload"
                        className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
                      >
                        <svg className="h-4 w-4 text-blue-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload Signed Document (PDF only, max 5MB) <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-4 hover:bg-gray-100 transition-colors">
                        <input
                          type="file"
                          id="pdf-upload"
                          accept="application/pdf"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          required
                        />
                        <div className="flex flex-col items-center justify-center py-2">
                          <svg className="h-10 w-10 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm font-medium text-blue-600">Click or drag file to upload</p>
                          <p className="text-xs text-gray-500">PDF format only, max 5MB</p>
                        </div>
                      </div>
                      {fileError && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fileError}
                        </p>
                      )}
                      {pdfFile && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100 flex items-center">
                          <svg className="h-6 w-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-green-700">File selected:</p>
                            <p className="text-xs text-green-600">{pdfFile.name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6 flex justify-center">
                  <button
                    onClick={handleSubmitToOrganization}
                    disabled={submitting || !pdfFile}
                    className={`bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition transform hover:scale-105 text-lg ${
                      submitting || !pdfFile
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {submitting ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Submit Organization for Review
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 ml-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>
              </>
            )}

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Services
              </h3>
              {organization.services && organization.services.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requirements
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {organization.services.map((service) => (
                        <tr key={service.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {service.serviceName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {service.category}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {service.description}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {service.requirements}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">
                  No services listed for this organization
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationUserView;
