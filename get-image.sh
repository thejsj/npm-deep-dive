export IMAGE_IDS=$(docker images --format "{{.ID}}")
export IMAGE_ID=$(echo $IMAGE_IDS | cut -d " " -f 1)
export CONTAINER_ID=$(docker run --detach $IMAGE_ID sleep 999999 | cut -c1-12)
echo $CONTAINER_ID
