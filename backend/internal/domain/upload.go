package domain

type UploadTicket struct {
	URL    string
	Fields map[string]string
	Path   string
}
